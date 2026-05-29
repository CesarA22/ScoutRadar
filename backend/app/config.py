"""Central configuration for ScoutRadar backend."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = PROJECT_ROOT.parent

SEASONS_ALLOWED = {2023, 2024}
POSITION_GROUPS = ["GK", "CB", "FB", "DM", "CM_AM", "W", "ST"]

METRICS_ALLOWLIST = frozenset([
    "xg_per90", "xa_per90", "prog_passes_per90", "prog_carries_per90",
    "touches_box_per90", "tackles_per90", "interceptions_per90",
    "aerial_won_per90", "passes_completed_per90", "pass_accuracy",
    "pressures_per90", "shots_per90", "goals_per90", "assists_per90",
    "minutes", "age", "position_group", "team", "season",
    "prospect_score", "rarity_score", "impact_score",
    "cluster_id", "umap_x", "umap_y",
])

USER_INPUT_MAX_CHARS = 800
TOOL_MAX_ROWS = 50
K_MAX = 25


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://scout:scout@localhost:5432/scoutradar"

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://") and "+psycopg" not in url:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
    openai_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    chat_history_limit: int = 20
    chat_session_ttl_seconds: int = 60 * 60 * 24 * 7  # 7 days
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    env: str = "development"
    data_processed_dir: str = str(REPO_ROOT / "data" / "processed")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
