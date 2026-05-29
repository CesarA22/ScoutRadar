"""Chat orchestration service with Redis memory."""
import re

from sqlalchemy.orm import Session

from app.chat.policy import check_policy
from app.chat.postcheck import check_response
from app.chat.router import run_planner
from app.chat.tools import execute_tools
from app.chat.writer import run_writer
from app.services import redis_service as redis_svc

_REFERENTIAL_PLAYER = re.compile(
    r"\b(este|esta|esse|essa|this|deste|desta|desse|dessa|o jogador|a jogadora|the player|player|jogador)\b",
    re.IGNORECASE,
)


def _extract_evidence_error(evidence: dict | None) -> str | None:
    if not evidence:
        return None
    for val in evidence.values():
        if isinstance(val, dict) and val.get("error"):
            return str(val["error"])
    return None


def _apply_active_player(message: str, context: dict, plan: dict) -> dict:
    """Inject UI-selected player into plan when the user refers to them implicitly."""
    player_key = context.get("player_key")
    player_name = context.get("player_name")
    if not player_key and not player_name:
        return plan

    entities = plan.setdefault("entities", {})
    players = list(entities.get("players") or [])
    referential = bool(_REFERENTIAL_PLAYER.search(message or ""))
    intent = plan.get("intent", "out_of_scope")

    if not players:
        entities["players"] = [player_key or player_name]

    if referential and intent == "out_of_scope":
        plan["intent"] = "player_profile"

    if player_key or player_name:
        filters = plan.setdefault("filters", {})
        if context.get("player_season"):
            filters["season"] = [int(context["player_season"])]

    return plan


def _apply_compare_context(message: str, context: dict, plan: dict) -> dict:
    """Inject UI-selected player pair into plan for compare conversations."""
    key_a = context.get("compare_player_a_key")
    key_b = context.get("compare_player_b_key")
    if not key_a or not key_b:
        return plan

    entities = plan.setdefault("entities", {})
    players = list(entities.get("players") or [])
    if len(players) < 2:
        entities["players"] = [key_a, key_b]

    intent = plan.get("intent", "out_of_scope")
    if intent == "out_of_scope":
        plan["intent"] = "compare"

    filters = plan.setdefault("filters", {})
    if context.get("season"):
        filters["season"] = [int(context["season"])]

    return plan


def run_chat(db: Session, message: str, context: dict, session_id: str = "") -> dict:
    session_id = session_id or redis_svc.create_session_id()
    history = redis_svc.get_history(session_id)
    history_text = redis_svc.format_history_for_llm(history)

    policy = check_policy(message)
    if not policy.allowed:
        answer = policy.reason
        user_id = redis_svc.append_message(session_id, "user", message)
        msg_id = redis_svc.append_message(session_id, "assistant", answer, {"blocked": True})
        return {
            "session_id": session_id,
            "message_id": msg_id,
            "answer": answer,
            "plan": {"intent": "blocked"},
            "evidence": {},
            "tools_called": [],
            "postcheck_ok": True,
            "audit": {"policy": policy.reason, "user_message_id": user_id},
        }

    sanitized = policy.sanitized_input or message
    enriched_context = {**context, "chat_history": history_text}
    plan = run_planner(sanitized, enriched_context)
    if enriched_context.get("compare_player_a_key") and enriched_context.get("compare_player_b_key"):
        plan = _apply_compare_context(sanitized, enriched_context, plan)
    else:
        plan = _apply_active_player(sanitized, enriched_context, plan)
    tool_result = execute_tools(plan, db)
    evidence = tool_result.get("evidence")

    if plan.get("intent") == "methodology" and evidence:
        answer = evidence.get("methodology", "")
        postcheck_ok = True
    elif plan.get("intent") == "out_of_scope":
        answer = "Não posso responder a essa pergunta. Escopo: dados do Brasileirão 2023/2024, jogadores U-23."
        postcheck_ok = True
    else:
        tool_error = _extract_evidence_error(evidence)
        if tool_error:
            pname = context.get("player_name")
            answer = f"Não consegui buscar os dados do jogador: {tool_error}"
            if pname:
                answer += f" O contexto ativo é {pname}."
            postcheck_ok = True
        else:
            ai_insight = context.get("ai_insight", "")
            answer = run_writer(sanitized, plan, evidence, ai_insight, history_text)
            postcheck_ok, err = check_response(answer)
            if not postcheck_ok:
                answer += f"\n\n[Post-check: {err}]"

    redis_svc.append_message(session_id, "user", sanitized)
    message_id = redis_svc.append_message(
        session_id,
        "assistant",
        answer,
        {"intent": plan.get("intent"), "postcheck_ok": postcheck_ok},
    )

    return {
        "session_id": session_id,
        "message_id": message_id,
        "answer": answer,
        "plan": plan,
        "evidence": evidence or {},
        "tools_called": tool_result.get("tools_called", []),
        "postcheck_ok": postcheck_ok,
        "audit": {"policy": "OK", "intent": plan.get("intent"), "tools": tool_result.get("tools_called", [])},
    }
