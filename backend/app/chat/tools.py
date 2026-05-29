"""Chat tools - DB-backed queries."""
from typing import Any

from sqlalchemy.orm import Session

from app.config import K_MAX, METRICS_ALLOWLIST, POSITION_GROUPS, SEASONS_ALLOWED, TOOL_MAX_ROWS
from app.services import player_service as ps


def explain_methodology() -> str:
    return """
## Metodologia do Scout Radar
Dados do Brasileirão Série A (2023–2024).
Pipeline: filtragem U-23, normalização per90, z-scores por posição, UMAP, HDBSCAN, Isolation Forest.
Fontes (dataset): PostgreSQL (players, features, embeddings, scores).
"""


def explain_cluster(db: Session, position_group: str, season: int, cluster_id: int) -> dict:
    if position_group not in POSITION_GROUPS or season not in SEASONS_ALLOWED:
        return {"error": "position_group ou season inválido."}

    items, _ = ps.list_players(db, seasons=[season], position_groups=[position_group], clusters=[cluster_id], limit=500)
    if not items:
        return {"error": "Cluster vazio ou não encontrado."}

    feat_cols = [c for c in items[0].get("metrics", {}) if "per90" in c or c.startswith("z_")]
    means = {}
    for col in feat_cols:
        vals = [i.get("metrics", {}).get(col) for i in items if i.get("metrics", {}).get(col) is not None]
        means[col] = sum(vals) / len(vals) if vals else 0

    all_items, _ = ps.list_players(db, seasons=[season], position_groups=[position_group], limit=500)
    pos_means = {}
    for col in feat_cols:
        vals = [i.get("metrics", {}).get(col) for i in all_items if i.get("metrics", {}).get(col) is not None]
        pos_means[col] = sum(vals) / len(vals) if vals else 0

    reps = sorted(items, key=lambda x: x.get("minutes", 0), reverse=True)[:3]
    return {
        "cluster_id": cluster_id,
        "position_group": position_group,
        "season": season,
        "cluster_means": means,
        "position_means": pos_means,
        "representative_players": [{"player": r["player"], "team": r["team"], "minutes": r["minutes"]} for r in reps],
    }


def top_k(db: Session, filters: dict, metric: str, k: int = 10) -> list[dict]:
    if metric not in METRICS_ALLOWLIST:
        metric = "prospect_score"
    k = min(max(1, int(k)), K_MAX)
    items = ps.top_outliers(
        db,
        metric=metric,
        k=k,
        seasons=filters.get("season"),
        position_groups=filters.get("position_group"),
        teams=filters.get("team"),
        age_max=filters.get("age_max"),
        minutes_min=filters.get("minutes_min"),
    )
    return items[:TOOL_MAX_ROWS]


def execute_tools(plan: dict, db: Session) -> dict:
    intent = plan.get("intent", "out_of_scope")
    if intent == "out_of_scope":
        return {"intent": "out_of_scope", "evidence": None, "tools_called": []}

    filters = plan.get("filters", {})
    entities = plan.get("entities", {})
    metrics = plan.get("metrics", [])
    k = plan.get("k", 10)
    tools_called = []
    evidence = {}

    if intent == "methodology":
        evidence["methodology"] = explain_methodology()
        tools_called.append("explain_methodology")
        return {"intent": intent, "evidence": evidence, "tools_called": tools_called}

    if intent == "player_profile":
        players = entities.get("players", [])
        if players:
            evidence["profile"] = ps.get_player(db, players[0]) or {"error": "Jogador não encontrado."}
            tools_called.append("get_player_profile")
        else:
            evidence["profile"] = {"error": "Nenhum jogador especificado."}

    elif intent == "compare":
        players = entities.get("players", [])
        if len(players) >= 2:
            evidence["compare"] = ps.compare_players(db, players[0], players[1])
            tools_called.append("compare_players")
        else:
            evidence["compare"] = {"error": "É necessário especificar 2 jogadores."}

    elif intent == "top_k":
        metric = metrics[0] if metrics else "prospect_score"
        evidence["top_k"] = top_k(db, filters, metric, k)
        tools_called.append("top_k")

    elif intent == "similar":
        players = entities.get("players", [])
        if players:
            evidence["similar"] = ps.similar_players(db, players[0], k)
            tools_called.append("similar_players")
        else:
            evidence["similar"] = {"error": "Jogador não especificado."}

    elif intent == "cluster_explain":
        cid = entities.get("cluster_id") or 0
        pg = filters.get("position_group", ["CM_AM"])[0]
        seas = filters.get("season", [2024])[0]
        evidence["cluster"] = explain_cluster(db, pg, seas, cid)
        tools_called.append("explain_cluster")

    return {"intent": intent, "evidence": evidence, "tools_called": tools_called}
