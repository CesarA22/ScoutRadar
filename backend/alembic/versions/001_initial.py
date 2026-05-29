"""Initial schema

Revision ID: 001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dataset_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), server_default="completed"),
        sa.Column("is_active", sa.Boolean(), server_default="false"),
        sa.Column("row_count", sa.Integer(), server_default="0"),
        sa.Column("seasons", postgresql.JSONB()),
        sa.Column("content_hash", sa.String(64)),
        sa.Column("meta", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_dataset_runs_is_active", "dataset_runs", ["is_active"])

    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dataset_run_id", sa.Integer(), sa.ForeignKey("dataset_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_key", sa.String(128), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("team", sa.String(128), nullable=False),
        sa.Column("season", sa.Integer(), nullable=False),
        sa.Column("position_group", sa.String(16), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("minutes", sa.Integer(), nullable=False),
        sa.UniqueConstraint("player_key", "season", "dataset_run_id", name="uq_player_season_run"),
    )
    op.create_index("ix_players_dataset_run_id", "players", ["dataset_run_id"])
    op.create_index("ix_players_player_key", "players", ["player_key"])
    op.create_index("ix_players_team", "players", ["team"])
    op.create_index("ix_players_season", "players", ["season"])
    op.create_index("ix_players_position_group", "players", ["position_group"])

    op.create_table(
        "player_features",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), unique=True),
        sa.Column("metrics", postgresql.JSONB(), server_default="{}"),
        sa.Column("xg_per90", sa.Float()),
        sa.Column("xa_per90", sa.Float()),
        sa.Column("prog_passes_per90", sa.Float()),
        sa.Column("tackles_per90", sa.Float()),
        sa.Column("pass_accuracy", sa.Float()),
    )

    op.create_table(
        "player_embeddings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), unique=True),
        sa.Column("umap_x", sa.Float(), nullable=False),
        sa.Column("umap_y", sa.Float(), nullable=False),
        sa.Column("cluster_id", sa.Integer(), nullable=False),
        sa.Column("cluster_prob", sa.Float(), server_default="0"),
        sa.Column("is_noise", sa.Integer(), server_default="0"),
    )
    op.create_index("ix_player_embeddings_cluster_id", "player_embeddings", ["cluster_id"])

    op.create_table(
        "player_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), unique=True),
        sa.Column("rarity_score", sa.Float(), nullable=False),
        sa.Column("impact_score", sa.Float(), nullable=False),
        sa.Column("prospect_score", sa.Float(), nullable=False),
    )
    op.create_index("ix_player_scores_prospect_score", "player_scores", ["prospect_score"])

    op.create_table(
        "player_cards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), unique=True),
        sa.Column("card_text", sa.Text(), nullable=False),
    )

    op.create_table(
        "player_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), unique=True),
        sa.Column("wikidata_qid", sa.String(32)),
        sa.Column("image_url", sa.Text()),
        sa.Column("license", sa.String(128)),
    )


def downgrade() -> None:
    op.drop_table("player_images")
    op.drop_table("player_cards")
    op.drop_table("player_scores")
    op.drop_table("player_embeddings")
    op.drop_table("player_features")
    op.drop_table("players")
    op.drop_table("dataset_runs")
