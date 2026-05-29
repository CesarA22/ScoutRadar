"""Router / Planner - LLM structured outputs."""
import json
import logging
import re
from typing import Any

from openai import OpenAI

from app.config import K_MAX, METRICS_ALLOWLIST, POSITION_GROUPS, SEASONS_ALLOWED, get_settings

logger = logging.getLogger(__name__)

PLANNER_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["player_profile", "compare", "top_k", "similar", "cluster_explain", "methodology", "out_of_scope"],
        },
        "filters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "season": {"type": "array", "items": {"type": "integer"}},
                "position_group": {"type": "array", "items": {"type": "string"}},
                "team": {"type": "array", "items": {"type": "string"}},
                "age_max": {"type": "integer"},
                "minutes_min": {"type": "integer"},
            },
            "required": ["season", "position_group", "team", "age_max", "minutes_min"],
        },
        "entities": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "players": {"type": "array", "items": {"type": "string"}},
                "cluster_id": {"type": "integer"},
            },
            "required": ["players", "cluster_id"],
        },
        "metrics": {"type": "array", "items": {"type": "string"}},
        "k": {"type": "integer"},
        "reason": {"type": "string"},
    },
    "required": ["intent", "filters", "entities", "metrics", "k", "reason"],
}

INTENT_ALIASES = {
    "comparar": "compare", "comparação": "compare", "comparison": "compare",
    "analise": "compare", "analisar": "compare", "analyze": "compare",
    "top": "top_k", "ranking": "top_k", "rank": "top_k",
    "similar": "similar", "similares": "similar",
    "metodologia": "methodology", "methodology": "methodology",
    "cluster": "cluster_explain", "perfil": "player_profile", "profile": "player_profile",
}


def _build_planner_prompt(user_message: str, context: dict[str, Any]) -> str:
    season = context.get("season", 2024)
    position_group = context.get("position_group", "CM_AM")
    minutes_min = context.get("minutes_min", 600)
    age_max = context.get("age_max", 23)
    metrics_list = sorted(METRICS_ALLOWLIST - {"minutes", "age", "position_group", "team", "season"})
    metrics_str = ", ".join(metrics_list[:20])
    ai_insight = context.get("ai_insight", "") or ""
    ai_ctx_block = f"\n\nCONTEXT (recent AI insight):\n{ai_insight[:800]}\n" if ai_insight and len(ai_insight) > 20 else ""
    return f"""You are a query planner for a football analytics application.
Your job is ONLY to classify the user question and extract parameters.{ai_ctx_block}
Valid intents: player_profile, compare, top_k, similar, cluster_explain, methodology, out_of_scope
CONTEXT: season={season}, position_group={position_group}, minutes_min={minutes_min}, age_max={age_max}
Métricas: {metrics_str}
PERGUNTA: {user_message}
Return only JSON matching the schema."""


def _normalize_intent(raw: Any) -> str | None:
    if raw is None or str(raw).lower() == "null":
        return None
    s = str(raw).strip().lower()
    if s in INTENT_ALIASES:
        return INTENT_ALIASES[s]
    valid = set(PLANNER_JSON_SCHEMA["properties"]["intent"]["enum"])
    if s in valid:
        return s
    for v in valid:
        if v in s or s in v:
            return v
    return None


def _heuristic_compare_plan(user_message: str) -> dict | None:
    msg = (user_message or "").lower()
    if not re.search(r"compar(e|ar)|analis(e|ar)|vs\.?|versus", msg):
        return None
    nums = re.findall(r"(?:jogador|player)s?\s*(\d+)", msg, re.IGNORECASE)
    nums.extend(re.findall(r"(?:com\s+o|com|e\s+o)\s+(\d+)\b", msg, re.IGNORECASE))
    nums = [n for n in nums if not (len(n) == 4 and n.startswith("20"))]
    seen, unique = set(), []
    for n in nums:
        if n not in seen:
            seen.add(n)
            unique.append(n)
    if len(unique) >= 2:
        return {
            "intent": "compare",
            "filters": {"season": [2024], "position_group": ["CM_AM"], "age_max": 23, "minutes_min": 600, "team": []},
            "entities": {"players": [f"Jogador {n}" for n in unique[:2]], "cluster_id": None},
            "metrics": [], "k": 10, "reason": "Comparação inferida.",
        }
    return None


def _validate_and_fix_plan(plan: dict, user_message: str = "") -> dict:
    default_plan = {
        "intent": "out_of_scope",
        "filters": {"season": [2024], "position_group": ["CM_AM"], "age_max": 23, "minutes_min": 600, "team": []},
        "entities": {"players": [], "cluster_id": None},
        "metrics": [], "k": 10, "reason": "Resposta inválida do planner.",
    }
    if plan is None or not isinstance(plan, dict):
        return _heuristic_compare_plan(user_message) or default_plan

    normalized = _normalize_intent(plan.get("intent"))
    if normalized:
        plan["intent"] = normalized
    elif _heuristic_compare_plan(user_message):
        plan.update(_heuristic_compare_plan(user_message))
    else:
        plan["intent"] = "out_of_scope"

    filters = plan.get("filters") or {}
    entities = plan.get("entities") or {}
    plan["filters"] = dict(filters)
    plan["entities"] = {"players": entities.get("players") or [], "cluster_id": entities.get("cluster_id")}

    seasons = filters.get("season") or [2024]
    if not isinstance(seasons, list):
        seasons = [seasons]
    plan["filters"]["season"] = [s for s in seasons if s in SEASONS_ALLOWED] or [2024]

    pg = filters.get("position_group") or ["CM_AM"]
    if not isinstance(pg, list):
        pg = [pg]
    plan["filters"]["position_group"] = [p for p in pg if p in POSITION_GROUPS] or ["CM_AM"]
    plan["filters"].setdefault("age_max", 23)
    plan["filters"].setdefault("minutes_min", 600)
    plan["filters"].setdefault("team", [])

    plan["metrics"] = [m for m in (plan.get("metrics") or []) if m in METRICS_ALLOWLIST]
    plan["k"] = min(max(1, int(plan.get("k") or 10)), K_MAX)
    return plan


def run_planner(user_message: str, context: dict[str, Any]) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        return _validate_and_fix_plan(None, user_message) | {"reason": "OpenAI API key não configurada."}

    prompt = _build_planner_prompt(user_message, context)
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "planner_output",
                "strict": False,
                "schema": PLANNER_JSON_SCHEMA,
            },
        }
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format=response_format,
        )
        content = response.choices[0].message.content
        plan = json.loads(content) if content else {}
    except Exception as e:
        logger.exception("Planner error: %s", e)
        plan = None

    return _validate_and_fix_plan(plan, user_message)
