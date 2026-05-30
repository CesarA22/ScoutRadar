"""Central configuration for ScoutRadar backend."""
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _strip_env_quotes(value: str) -> str:
    """Railway UI often stores values with literal surrounding quotes — strip until clean."""
    v = value.strip()
    for _ in range(5):
        if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
            v = v[1:-1].strip()
        else:
            break
    return v

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
        populate_by_name=True,
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

    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    resend_api_key: str = ""
    contact_to_email: str = "cesaraugusto213@gmail.com"
    contact_from_email: str = "onboarding@resend.dev"

    seed_username: str = Field(default="cesar", validation_alias="SEED_USER")
    seed_password: str = Field(default="admin@6347", validation_alias="SEED_PASSWORD")

    # Railway Bucket (S3-compatible / Tigris) — demo videos
    # Also accepts Railway variable references: ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION
    s3_endpoint_url: str = Field(
        default="",
        validation_alias=AliasChoices("S3_ENDPOINT_URL", "ENDPOINT", "AWS_ENDPOINT_URL"),
    )
    s3_bucket_name: str = Field(
        default="",
        validation_alias=AliasChoices(
            "S3_BUCKET_NAME",
            "BUCKET",
            "AWS_S3_BUCKET_NAME",
            "RAILWAY_BUCKET_NAME",
        ),
    )
    s3_access_key_id: str = Field(
        default="",
        validation_alias=AliasChoices("S3_ACCESS_KEY_ID", "ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"),
    )
    s3_secret_access_key: str = Field(
        default="",
        validation_alias=AliasChoices("S3_SECRET_ACCESS_KEY", "SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"),
    )
    s3_region: str = Field(
        default="auto",
        validation_alias=AliasChoices("S3_REGION", "REGION", "AWS_DEFAULT_REGION"),
    )
    # Virtual-hosted public base (optional; only works if objects are public-read)
    s3_public_base_url: str = ""
    demo_video_presign_seconds: int = 3600

    @field_validator(
        "s3_endpoint_url",
        "s3_bucket_name",
        "s3_access_key_id",
        "s3_secret_access_key",
        "s3_region",
        "s3_public_base_url",
        mode="before",
    )
    @classmethod
    def _normalize_s3_env(cls, v: object) -> object:
        if isinstance(v, str):
            return _strip_env_quotes(v)
        return v

    @property
    def s3_configured(self) -> bool:
        return bool(
            self.s3_endpoint_url
            and self.s3_bucket_name
            and self.s3_access_key_id
            and self.s3_secret_access_key
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
