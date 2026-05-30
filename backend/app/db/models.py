from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DatasetRun(Base):
    __tablename__ = "dataset_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="completed")
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    seasons: Mapped[Optional[list]] = mapped_column(JSONB)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64))
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    players: Mapped[list["Player"]] = relationship(back_populates="dataset_run")


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (UniqueConstraint("player_key", "season", "dataset_run_id", name="uq_player_season_run"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dataset_run_id: Mapped[int] = mapped_column(ForeignKey("dataset_runs.id", ondelete="CASCADE"), index=True)
    player_key: Mapped[str] = mapped_column(String(128), index=True)
    name: Mapped[str] = mapped_column(String(256))
    team: Mapped[str] = mapped_column(String(128), index=True)
    season: Mapped[int] = mapped_column(Integer, index=True)
    position_group: Mapped[str] = mapped_column(String(16), index=True)
    age: Mapped[int] = mapped_column(Integer)
    minutes: Mapped[int] = mapped_column(Integer)

    dataset_run: Mapped["DatasetRun"] = relationship(back_populates="players")
    features: Mapped[Optional["PlayerFeature"]] = relationship(back_populates="player", uselist=False, cascade="all, delete-orphan")
    embedding: Mapped[Optional["PlayerEmbedding"]] = relationship(back_populates="player", uselist=False, cascade="all, delete-orphan")
    scores: Mapped[Optional["PlayerScore"]] = relationship(back_populates="player", uselist=False, cascade="all, delete-orphan")
    card: Mapped[Optional["PlayerCard"]] = relationship(back_populates="player", uselist=False, cascade="all, delete-orphan")
    image: Mapped[Optional["PlayerImage"]] = relationship(back_populates="player", uselist=False, cascade="all, delete-orphan")


class PlayerFeature(Base):
    __tablename__ = "player_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), unique=True)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    xg_per90: Mapped[Optional[float]] = mapped_column(Float)
    xa_per90: Mapped[Optional[float]] = mapped_column(Float)
    prog_passes_per90: Mapped[Optional[float]] = mapped_column(Float)
    tackles_per90: Mapped[Optional[float]] = mapped_column(Float)
    pass_accuracy: Mapped[Optional[float]] = mapped_column(Float)

    player: Mapped["Player"] = relationship(back_populates="features")


class PlayerEmbedding(Base):
    __tablename__ = "player_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), unique=True)
    umap_x: Mapped[float] = mapped_column(Float)
    umap_y: Mapped[float] = mapped_column(Float)
    cluster_id: Mapped[int] = mapped_column(Integer, index=True)
    cluster_prob: Mapped[float] = mapped_column(Float, default=0.0)
    is_noise: Mapped[int] = mapped_column(Integer, default=0)

    player: Mapped["Player"] = relationship(back_populates="embedding")


class PlayerScore(Base):
    __tablename__ = "player_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), unique=True)
    rarity_score: Mapped[float] = mapped_column(Float)
    impact_score: Mapped[float] = mapped_column(Float)
    prospect_score: Mapped[float] = mapped_column(Float, index=True)

    player: Mapped["Player"] = relationship(back_populates="scores")


class PlayerCard(Base):
    __tablename__ = "player_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), unique=True)
    card_text: Mapped[str] = mapped_column(Text)

    player: Mapped["Player"] = relationship(back_populates="card")


class PlayerImage(Base):
    __tablename__ = "player_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), unique=True)
    wikidata_qid: Mapped[Optional[str]] = mapped_column(String(32))
    image_url: Mapped[Optional[str]] = mapped_column(Text)
    license: Mapped[Optional[str]] = mapped_column(String(128))

    player: Mapped["Player"] = relationship(back_populates="image")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
