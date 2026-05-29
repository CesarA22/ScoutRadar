"""Migrate existing parquet files to PostgreSQL."""
import json
import logging
import sys
from pathlib import Path

import pandas as pd

from app.config import get_settings
from app.db.session import SessionLocal
from app.pipeline.persist import persist_dataframes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_parquet(data_dir: Path | None = None) -> bool:
    settings = get_settings()
    data_dir = data_dir or Path(settings.data_processed_dir)

    master_path = data_dir / "master.parquet"
    if not master_path.exists():
        logger.error("No parquet data at %s. Run with --sample first.", data_dir)
        return False

    master = pd.read_parquet(data_dir / "master.parquet")
    features = pd.read_parquet(data_dir / "features.parquet") if (data_dir / "features.parquet").exists() else pd.DataFrame()
    umap_df = pd.read_parquet(data_dir / "umap_clusters.parquet") if (data_dir / "umap_clusters.parquet").exists() else pd.DataFrame()
    outliers_df = pd.read_parquet(data_dir / "outliers.parquet") if (data_dir / "outliers.parquet").exists() else pd.DataFrame()

    cards = {}
    cards_path = data_dir / "player_cards.jsonl"
    if cards_path.exists():
        with open(cards_path, encoding="utf-8") as f:
            for line in f:
                obj = json.loads(line.strip())
                if obj.get("player_key"):
                    cards[obj["player_key"]] = obj.get("card", "")

    seasons = sorted(master["season"].unique().tolist()) if "season" in master.columns else [2023, 2024]
    source = "parquet/migrate"
    meta_path = data_dir / "metadata.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        source = meta.get("source", source)

    db = SessionLocal()
    try:
        run = persist_dataframes(db, master, features, umap_df, outliers_df, cards, source, seasons)
        logger.info("Migrated %d players to dataset_run id=%s", len(master), run.id)
        return True
    finally:
        db.close()


def main():
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    ok = migrate_parquet(data_dir)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
