"""Player query and serialization service."""
from typing import Any, Optional

import numpy as np
from rapidfuzz import fuzz, process
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.config import METRICS_ALLOWLIST, POSITION_GROUPS, TOOL_MAX_ROWS
from app.db.models import DatasetRun, Player


def get_active_run(db: Session) -> Optional[DatasetRun]:
    return db.scalar(select(DatasetRun).where(DatasetRun.is_active.is_(True)).order_by(DatasetRun.id.desc()))


def _player_query(db: Session, run_id: int):
    return (
        select(Player)
        .where(Player.dataset_run_id == run_id)
        .options(
            joinedload(Player.features),
            joinedload(Player.embedding),
            joinedload(Player.scores),
            joinedload(Player.card),
            joinedload(Player.image),
        )
    )


def player_to_dict(player: Player) -> dict[str, Any]:
    metrics: dict[str, Any] = {}
    if player.features and player.features.metrics:
        metrics = dict(player.features.metrics)

    out: dict[str, Any] = {
        "player_key": player.player_key,
        "player": player.name,
        "team": player.team,
        "season": player.season,
        "position_group": player.position_group,
        "age": player.age,
        "minutes": player.minutes,
        "metrics": metrics,
    }

    if player.embedding:
        out.update({
            "umap_x": player.embedding.umap_x,
            "umap_y": player.embedding.umap_y,
            "cluster_id": player.embedding.cluster_id,
            "cluster_prob": player.embedding.cluster_prob,
            "is_noise": player.embedding.is_noise,
        })

    if player.scores:
        out.update({
            "rarity_score": player.scores.rarity_score,
            "impact_score": player.scores.impact_score,
            "prospect_score": player.scores.prospect_score,
        })

    if player.card:
        out["card"] = player.card.card_text

    if player.image and player.image.image_url:
        out["image_url"] = player.image.image_url

    for k, v in metrics.items():
        if k not in out:
            out[k] = v

    return out


def list_players(
    db: Session,
    *,
    seasons: Optional[list[int]] = None,
    position_groups: Optional[list[str]] = None,
    teams: Optional[list[str]] = None,
    clusters: Optional[list[int]] = None,
    age_max: Optional[int] = None,
    minutes_min: Optional[int] = None,
    limit: int = 500,
) -> tuple[list[dict[str, Any]], int]:
    run = get_active_run(db)
    if not run:
        return [], 0

    stmt = _player_query(db, run.id)
    players = db.scalars(stmt).unique().all()

    filtered = []
    for p in players:
        if seasons and p.season not in seasons:
            continue
        if position_groups and p.position_group not in position_groups:
            continue
        if teams and p.team not in teams:
            continue
        if age_max is not None and p.age > age_max:
            continue
        if minutes_min is not None and p.minutes < minutes_min:
            continue
        if clusters and p.embedding and p.embedding.cluster_id not in clusters:
            continue
        filtered.append(p)

    total = len(filtered)
    items = [player_to_dict(p) for p in filtered[:limit]]
    return items, total


def get_player(db: Session, player_key: str, season: Optional[int] = None) -> Optional[dict[str, Any]]:
    run = get_active_run(db)
    if not run:
        return None

    stmt = _player_query(db, run.id).where(Player.player_key == player_key)
    if season is not None:
        stmt = stmt.where(Player.season == season)

    player = db.scalars(stmt).unique().first()
    if not player:
        stmt = _player_query(db, run.id).where(Player.name.ilike(f"%{player_key}%"))
        player = db.scalars(stmt).unique().first()

    return player_to_dict(player) if player else None


def search_players(db: Session, query: str, limit: int = 10) -> list[dict[str, Any]]:
    run = get_active_run(db)
    if not run:
        return []

    players = db.scalars(_player_query(db, run.id)).unique().all()
    names = list({p.name for p in players})
    matches = process.extract(query, names, scorer=fuzz.token_sort_ratio, limit=limit)
    matched_names = {m[0] for m in matches}

    results = []
    for p in players:
        if p.name in matched_names:
            results.append(player_to_dict(p))
        if len(results) >= limit:
            break
    return results[:limit]


def compare_players(db: Session, key_a: str, key_b: str) -> dict[str, Any]:
    a = get_player(db, key_a)
    b = get_player(db, key_b)
    if not a or not b:
        return {"error": "Um ou ambos jogadores não encontrados."}

    metrics = {}
    for m in METRICS_ALLOWLIST:
        if m in a or m in a.get("metrics", {}):
            val_a = a.get(m, a.get("metrics", {}).get(m))
            val_b = b.get(m, b.get("metrics", {}).get(m))
            if val_a is not None or val_b is not None:
                metrics[m] = {"a": val_a, "b": val_b}

    return {
        "player_a": {k: a[k] for k in ["player", "team", "season", "player_key"] if k in a},
        "player_b": {k: b[k] for k in ["player", "team", "season", "player_key"] if k in b},
        "metrics": metrics,
    }


def similar_players(db: Session, player_key: str, k: int = 5) -> list[dict[str, Any]]:
    target = get_player(db, player_key)
    if not target:
        return []

    run = get_active_run(db)
    if not run:
        return []

    players = db.scalars(_player_query(db, run.id)).unique().all()
    feat_cols = [c for c in target.get("metrics", {}) if "per90" in c or c.startswith("z_")]
    if not feat_cols:
        feat_cols = ["xg_per90", "xa_per90", "tackles_per90"]

    candidates = []
    for p in players:
        if p.player_key == target["player_key"] and p.season == target["season"]:
            continue
        if p.position_group != target["position_group"] or p.season != target["season"]:
            continue
        d = player_to_dict(p)
        candidates.append(d)

    if not candidates:
        return []

    def vec(d: dict) -> np.ndarray:
        m = d.get("metrics", {})
        return np.array([float(m.get(c, 0) or 0) for c in feat_cols])

    t_vec = vec(target)
    for c in candidates:
        dist = float(np.linalg.norm(vec(c) - t_vec))
        c["_dist"] = dist

    candidates.sort(key=lambda x: x["_dist"])
    for c in candidates:
        c.pop("_dist", None)
    return candidates[:k]


def top_outliers(db: Session, metric: str = "prospect_score", k: int = 25, **filters) -> list[dict[str, Any]]:
    items, _ = list_players(
        db,
        seasons=filters.get("seasons"),
        position_groups=filters.get("position_groups"),
        teams=filters.get("teams"),
        age_max=filters.get("age_max"),
        minutes_min=filters.get("minutes_min"),
        limit=1000,
    )
    if not items:
        return []

    if metric not in METRICS_ALLOWLIST:
        metric = "prospect_score"

    items = [i for i in items if i.get(metric) is not None]
    items.sort(key=lambda x: x.get(metric, 0), reverse=True)
    return items[: min(k, TOOL_MAX_ROWS)]


def get_filters(db: Session) -> dict[str, list]:
    run = get_active_run(db)
    if not run:
        return {"seasons": [], "teams": [], "clusters": [], "position_groups": POSITION_GROUPS}

    players = db.scalars(_player_query(db, run.id)).unique().all()
    teams = sorted({p.team for p in players})
    seasons = sorted({p.season for p in players})
    clusters = sorted({p.embedding.cluster_id for p in players if p.embedding})
    return {
        "seasons": seasons,
        "teams": teams,
        "clusters": clusters,
        "position_groups": POSITION_GROUPS,
    }
