"""Chat orchestration service with Redis memory."""
from sqlalchemy.orm import Session

from app.chat.policy import check_policy
from app.chat.postcheck import check_response
from app.chat.router import run_planner
from app.chat.tools import execute_tools
from app.chat.writer import run_writer
from app.services import redis_service as redis_svc


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
    tool_result = execute_tools(plan, db)
    evidence = tool_result.get("evidence")

    if plan.get("intent") == "methodology" and evidence:
        answer = evidence.get("methodology", "")
        postcheck_ok = True
    elif plan.get("intent") == "out_of_scope":
        answer = "Não posso responder a essa pergunta. Escopo: dados do Brasileirão 2023/2024, jogadores U-23."
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
