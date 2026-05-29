"""Sample data generator for development."""
import json
from typing import Tuple

import numpy as np
import pandas as pd

from app.config import SEASONS_ALLOWED


def generate_sample_dataframes(n: int = 200) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, dict[str, str]]:
    np.random.seed(42)
    players_used = [f"Jogador {i + 1}" for i in range(n)]
    seasons = np.random.choice(list(SEASONS_ALLOWED), n)
    teams_list = ["Time A", "Time B", "Time C", "Time D", "Time E", "Time F", "Time G", "Time H", "Time I", "Time J"]
    teams = (teams_list * (n // len(teams_list) + 1))[:n]
    positions = list(np.random.choice(["GK", "CB", "FB", "DM", "CM_AM", "W", "ST"], n))

    def _make_key(name: str, season: int) -> str:
        return f"{name.lower().replace(' ', '_')}_{season}"

    master = pd.DataFrame({
        "player_key": [_make_key(p, int(s)) for p, s in zip(players_used, seasons)],
        "player": players_used,
        "team": teams,
        "season": seasons,
        "position_group": positions,
        "age": np.random.randint(18, 24, n),
        "minutes": np.random.randint(400, 2500, n),
    }).drop_duplicates(subset=["player_key"], keep="first").reset_index(drop=True)

    feat_cols = ["xg_per90", "xa_per90", "prog_passes_per90", "prog_carries_per90", "tackles_per90", "pass_accuracy"]
    features = master[["player_key", "season"]].copy()
    for c in feat_cols:
        features[c] = np.random.randn(len(master)) * 0.5 + np.random.rand(len(master))

    # z-scores by position
    for c in feat_cols:
        z_col = f"z_{c}"
        features[z_col] = features.groupby(master["position_group"].values)[c].transform(
            lambda x: (x - x.mean()) / (x.std() + 1e-8)
        )

    umap_clusters = master[["player_key", "player", "team", "season", "position_group"]].copy()
    umap_clusters["umap_x"] = np.random.randn(len(master)) * 2
    umap_clusters["umap_y"] = np.random.randn(len(master)) * 2
    umap_clusters["cluster_id"] = np.random.randint(0, 5, len(master))
    umap_clusters["cluster_prob"] = np.random.rand(len(master))
    umap_clusters["is_noise"] = (np.random.rand(len(master)) > 0.9).astype(int)

    outliers = master[["player_key", "player", "team", "season"]].copy()
    outliers["rarity_score"] = np.random.rand(len(master)) * 0.5
    outliers["impact_score"] = np.random.rand(len(master)) * 0.5
    outliers["prospect_score"] = outliers["rarity_score"] + outliers["impact_score"] + np.random.rand(len(master)) * 0.3

    cards = {}
    for _, row in master.iterrows():
        pk = row["player_key"]
        cards[pk] = f"{row['player']} ({row['team']}, {row['season']}) - {row['position_group']}, {row['minutes']} min."

    return master, features, umap_clusters, outliers, cards


def run_sample_pipeline(db) -> bool:
    from app.pipeline.persist import persist_dataframes

    master, features, umap_df, outliers_df, cards = generate_sample_dataframes()
    persist_dataframes(db, master, features, umap_df, outliers_df, cards, "sample/generate_sample_data", [2023, 2024])
    return True
