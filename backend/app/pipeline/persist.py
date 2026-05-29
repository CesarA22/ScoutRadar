"""Persist pipeline DataFrames to PostgreSQL."""
import hashlib
from typing import Any

import pandas as pd
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db.models import (
    DatasetRun,
    Player,
    PlayerCard,
    PlayerEmbedding,
    PlayerFeature,
    PlayerScore,
)


def _extract_metrics(row: pd.Series, feat_cols: list[str]) -> dict[str, Any]:
    metrics = {}
    for c in feat_cols:
        if c in row.index and pd.notna(row[c]):
            val = row[c]
            if hasattr(val, "item"):
                val = val.item()
            metrics[c] = float(val) if isinstance(val, (int, float)) else val
    return metrics


def _indexed_metrics(metrics: dict[str, Any]) -> dict[str, float | None]:
    keys = ["xg_per90", "xa_per90", "prog_passes_per90", "tackles_per90", "pass_accuracy"]
    return {k: metrics.get(k) for k in keys}


def persist_dataframes(
    db: Session,
    master: pd.DataFrame,
    features: pd.DataFrame,
    umap_df: pd.DataFrame,
    outliers_df: pd.DataFrame,
    cards: dict[str, str],
    source: str,
    seasons: list[int],
) -> DatasetRun:
    db.execute(update(DatasetRun).values(is_active=False))

    content = master.to_csv(index=False) + features.to_csv(index=False)
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    run = DatasetRun(
        source=source,
        status="completed",
        is_active=True,
        row_count=len(master),
        seasons=seasons,
        content_hash=content_hash,
        meta={"schema_version": 2},
    )
    db.add(run)
    db.flush()

    feat_cols = [c for c in features.columns if c not in ("player_key", "season")]
    umap_map = umap_df.set_index("player_key").to_dict("index") if not umap_df.empty else {}
    out_map = outliers_df.set_index("player_key").to_dict("index") if not outliers_df.empty else {}
    feat_map = features.set_index("player_key").to_dict("index") if not features.empty else {}

    for _, row in master.iterrows():
        pk = str(row["player_key"])
        player = Player(
            dataset_run_id=run.id,
            player_key=pk,
            name=str(row["player"]),
            team=str(row["team"]),
            season=int(row["season"]),
            position_group=str(row["position_group"]),
            age=int(row["age"]),
            minutes=int(row["minutes"]),
        )
        db.add(player)
        db.flush()

        frow = feat_map.get(pk, {})
        metrics = _extract_metrics(pd.Series(frow), feat_cols) if frow else {}
        indexed = _indexed_metrics(metrics)
        db.add(PlayerFeature(player_id=player.id, metrics=metrics, **indexed))

        u = umap_map.get(pk, {})
        if u:
            db.add(PlayerEmbedding(
                player_id=player.id,
                umap_x=float(u.get("umap_x", 0)),
                umap_y=float(u.get("umap_y", 0)),
                cluster_id=int(u.get("cluster_id", 0)),
                cluster_prob=float(u.get("cluster_prob", 0)),
                is_noise=int(u.get("is_noise", 0)),
            ))

        o = out_map.get(pk, {})
        if o:
            db.add(PlayerScore(
                player_id=player.id,
                rarity_score=float(o.get("rarity_score", 0)),
                impact_score=float(o.get("impact_score", 0)),
                prospect_score=float(o.get("prospect_score", 0)),
            ))

        card_text = cards.get(pk, f"{row['player']} ({row['team']}, {row['season']})")
        db.add(PlayerCard(player_id=player.id, card_text=card_text))

    db.commit()
    db.refresh(run)
    return run
