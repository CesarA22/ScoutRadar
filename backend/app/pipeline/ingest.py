"""FBref ingestion pipeline with UMAP and z-scores."""
import json
import logging
import re
from datetime import datetime, timezone
from io import StringIO
from typing import Optional

import numpy as np
import pandas as pd
import requests

from app.config import SEASONS_ALLOWED

logger = logging.getLogger(__name__)

POS_MAP = {
    "GK": "GK", "DF": "CB", "DF,MF": "FB", "MF": "CM_AM", "MF,DF": "DM",
    "MF,FW": "CM_AM", "FW": "ST", "FW,MF": "W",
}
DEFAULT_POS = "CM_AM"

METRIC_RENAMES = {
    "gls": "goals_per90", "ast": "assists_per90", "xg": "xg_per90", "xag": "xa_per90",
    "prgc": "prog_carries_per90", "prgp": "prog_passes_per90", "tkl": "tackles_per90",
    "int": "interceptions_per90", "cmp": "passes_completed_per90", "cmp_percent": "pass_accuracy",
}


def _to_position_group(pos: str) -> str:
    if pd.isna(pos):
        return DEFAULT_POS
    pos = str(pos).split(",")[0].strip()
    return POS_MAP.get(pos, DEFAULT_POS)


def _make_key(name: str, season: int) -> str:
    slug = str(name).lower().replace(" ", "_").replace(".", "")
    for c in "áàãâéêíóôõúç":
        slug = slug.replace(c, "a" if c in "áàãâ" else "e" if c in "éê" else "i" if c == "í" else "o" if c in "óôõ" else "u" if c == "ú" else "c")
    return f"{slug}_{season}"


def _fetch_fbref(seasons: list[int]) -> pd.DataFrame:
    import soccerdata as sd

    league_options = ["BRA-Serie A", "BRA-Série A", "Serie A"]
    for league_id in league_options:
        try:
            fbref = sd.FBref(leagues=league_id, seasons=seasons)
            stats = fbref.read_player_season_stats(stat_type="standard")
            if stats is not None and not stats.empty:
                if "season" not in stats.columns and "Season" in stats.columns:
                    stats["season"] = stats["Season"]
                return stats
        except Exception as e:
            logger.debug("League %s failed: %s", league_id, e)
    raise ValueError("soccerdata não encontrou dados do Brasileirão.")


def _fetch_fbref_alternative(seasons: list[int]) -> pd.DataFrame:
    headers = {"User-Agent": "Mozilla/5.0 ScoutRadar/2.0"}
    all_dfs = []
    for season in seasons:
        url = f"https://fbref.com/en/comps/24/{season}/stats/{season}-Serie-A-Stats"
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        html = re.sub(r"<!--|-->", "", r.text)
        tables = pd.read_html(StringIO(html))
        for t in tables:
            cols = " ".join(str(c).lower() for c in t.columns)
            if "player" in cols and ("90s" in cols or "min" in cols):
                t["season"] = season
                all_dfs.append(t)
                break
    if not all_dfs:
        raise ValueError("FBref scrape failed")
    return pd.concat(all_dfs, ignore_index=True)


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ["_".join(str(c) for c in col).strip("_") for col in df.columns]
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    col_map = {"player": "player", "squad": "team", "min": "minutes", "minutes": "minutes", "90s": "90s", "age": "age", "pos": "pos"}
    for old, new in col_map.items():
        if old in df.columns and new not in df.columns:
            df = df.rename(columns={old: new})
    if "minutes" not in df.columns and "90s" in df.columns:
        df["minutes"] = (pd.to_numeric(df["90s"], errors="coerce") * 90).astype(int)
    return df


def _compute_features(master: pd.DataFrame, raw: pd.DataFrame) -> pd.DataFrame:
    features = master[["player_key", "season"]].copy()
    per90_cols = [c for c in raw.columns if "per_90" in c or "/90" in c or c.endswith("_per90")]
    numeric_cols = [c for c in raw.columns if c not in ("player_key", "player", "team", "season", "pos", "position_group")]
    use_cols = per90_cols[:15] if per90_cols else numeric_cols[:15]

    merged = master.merge(raw, on=["player"], how="left", suffixes=("", "_raw"))
    for c in use_cols:
        if c in merged.columns:
            clean = c.lower().replace(" ", "_").replace("-", "_")
            clean = METRIC_RENAMES.get(clean, clean)
            val = pd.to_numeric(merged[c], errors="coerce")
            if "90" not in clean and merged["minutes"].gt(0).any():
                val = val / merged["minutes"] * 90
            features[clean] = val.values

    for c in [col for col in features.columns if col not in ("player_key", "season")]:
        z_col = f"z_{c}"
        features[z_col] = features.groupby(master["position_group"].values)[c].transform(
            lambda x: (x - x.mean()) / (x.std() + 1e-8)
        )
    return features


def _compute_umap(master: pd.DataFrame, features: pd.DataFrame) -> pd.DataFrame:
    from sklearn.preprocessing import StandardScaler
    import umap

    umap_df = master[["player_key", "player", "team", "season", "position_group"]].copy()
    numeric_cols = [c for c in features.columns if features[c].dtype in (np.float64, np.float32) and c not in ("player_key", "season") and not c.startswith("z_")]
    if len(numeric_cols) < 2:
        umap_df["umap_x"] = np.random.randn(len(master)) * 2
        umap_df["umap_y"] = np.random.randn(len(master)) * 2
    else:
        X = StandardScaler().fit_transform(features[numeric_cols].fillna(0))
        reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=min(15, len(master) - 1))
        xy = reducer.fit_transform(X)
        umap_df["umap_x"] = xy[:, 0]
        umap_df["umap_y"] = xy[:, 1]

    try:
        import hdbscan
        clusterer = hdbscan.HDBSCAN(min_cluster_size=3, min_samples=2)
        umap_df["cluster_id"] = clusterer.fit_predict(umap_df[["umap_x", "umap_y"]])
        umap_df["cluster_prob"] = 0.9
        umap_df["is_noise"] = (umap_df["cluster_id"] == -1).astype(int)
    except Exception:
        umap_df["cluster_id"] = 0
        umap_df["cluster_prob"] = 0.9
        umap_df["is_noise"] = 0

    return umap_df


def _compute_outliers(master: pd.DataFrame, umap_df: pd.DataFrame) -> pd.DataFrame:
    from sklearn.ensemble import IsolationForest

    X_out = umap_df[["umap_x", "umap_y"]].values
    iso = IsolationForest(contamination=0.1, random_state=42)
    pred = iso.fit_predict(X_out)
    rarity = 1 - (pred == 1).astype(float) * 0.5
    impact = np.abs(umap_df["umap_x"]) + np.abs(umap_df["umap_y"])
    impact = (impact - impact.min()) / (impact.max() - impact.min() + 1e-8)
    outliers_df = master[["player_key", "player", "team", "season"]].copy()
    outliers_df["rarity_score"] = rarity
    outliers_df["impact_score"] = impact
    outliers_df["prospect_score"] = rarity + impact
    return outliers_df


def run_pipeline(seasons: Optional[list[int]] = None) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, dict[str, str]]:
    seasons = seasons or list(SEASONS_ALLOWED)
    try:
        df = _fetch_fbref(seasons)
    except (ValueError, ImportError) as e:
        logger.info("Trying scrape fallback: %s", e)
        df = _fetch_fbref_alternative(seasons)

    df = _normalize_columns(df)
    if "player" not in df.columns:
        raise ValueError("Coluna player não encontrada")

    df["position_group"] = df.get("pos", pd.Series(dtype=object)).apply(_to_position_group)
    df["age"] = pd.to_numeric(df.get("age", 22), errors="coerce").fillna(22).astype(int)
    df["season"] = pd.to_numeric(df.get("season", 2024), errors="coerce").fillna(2024).astype(int)
    df = df[df["age"] <= 23]
    df = df[df["minutes"] >= 400]
    df["player_key"] = df.apply(lambda r: _make_key(r["player"], int(r["season"])), axis=1)
    df = df.drop_duplicates(subset=["player_key"], keep="first").reset_index(drop=True)

    master_cols = ["player_key", "player", "team", "season", "position_group", "age", "minutes"]
    master = df[[c for c in master_cols if c in df.columns]].copy()
    features = _compute_features(master, df)
    umap_df = _compute_umap(master, features)
    outliers_df = _compute_outliers(master, umap_df)

    cards = {}
    for _, row in master.iterrows():
        cards[row["player_key"]] = (
            f"{row['player']} ({row['team']}, {row['season']}) - {row['position_group']}, {row['minutes']} min."
        )

    return master, features, umap_df, outliers_df, cards


def ingest_to_db(db, seasons: Optional[list[int]] = None, use_sample: bool = False) -> bool:
    from app.pipeline.persist import persist_dataframes
    from app.pipeline.sample import generate_sample_dataframes

    if use_sample:
        master, features, umap_df, outliers_df, cards = generate_sample_dataframes()
        source = "sample/generate_sample_data"
        seasons = [2023, 2024]
    else:
        try:
            master, features, umap_df, outliers_df, cards = run_pipeline(seasons)
            source = "FBref via soccerdata"
        except Exception as e:
            logger.warning("FBref failed, using sample: %s", e)
            master, features, umap_df, outliers_df, cards = generate_sample_dataframes()
            source = "sample/fallback"

    persist_dataframes(db, master, features, umap_df, outliers_df, cards, source, seasons or [2023, 2024])
    logger.info("Ingested %d players", len(master))
    return True
