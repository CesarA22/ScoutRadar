"""Chat orchestration service."""
from sqlalchemy.orm import Session

from app.chat.policy import check_policy
from app.chat.postcheck import check_response
from app.chat.router import run_planner
from app.chat.tools import execute_tools
from app.chat.writer import run_writer


def run_chat(db: Session, message: str, context: dict) -> dict:
    policy = check_policy(message)
    if not policy.allowed:
        return {
            "answer": policy.reason,
            "plan": {"intent": "blocked"},
            "evidence": {},
            "tools_called": [],
            "postcheck_ok": True,
            "audit": {"policy": policy.reason},
        }

    sanitized = policy.sanitized_input or message
    plan = run_planner(sanitized, context)
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
        answer = run_writer(sanitized, plan, evidence, ai_insight)
        postcheck_ok, err = check_response(answer)
        if not postcheck_ok:
            answer += f"\n\n[Post-check: {err}]"

    return {
        "answer": answer,
        "plan": plan,
        "evidence": evidence or {},
        "tools_called": tool_result.get("tools_called", []),
        "postcheck_ok": postcheck_ok,
        "audit": {"policy": "OK", "intent": plan.get("intent"), "tools": tool_result.get("tools_called", [])},
    }
