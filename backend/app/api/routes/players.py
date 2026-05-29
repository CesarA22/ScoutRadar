from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import CompareResponse, PlayerDetail, PlayerListResponse
from app.services import player_service as ps

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=PlayerListResponse)
def list_players(
    season: Optional[list[int]] = Query(None),
    position_group: Optional[list[str]] = Query(None),
    team: Optional[list[str]] = Query(None),
    cluster: Optional[list[int]] = Query(None),
    age_max: Optional[int] = Query(None),
    minutes_min: Optional[int] = Query(None),
    limit: int = Query(500, le=1000),
    db: Session = Depends(get_db),
):
    items, total = ps.list_players(
        db,
        seasons=season,
        position_groups=position_group,
        teams=team,
        clusters=cluster,
        age_max=age_max,
        minutes_min=minutes_min,
        limit=limit,
    )
    return PlayerListResponse(items=items, total=total)


@router.get("/search", response_model=list[PlayerDetail])
def search_players(q: str = Query(..., min_length=1), limit: int = Query(10, le=50), db: Session = Depends(get_db)):
    return ps.search_players(db, q, limit)


@router.get("/compare", response_model=CompareResponse)
def compare_players(keys: str = Query(..., description="Comma-separated player keys or names"), db: Session = Depends(get_db)):
    parts = [p.strip() for p in keys.split(",") if p.strip()]
    if len(parts) < 2:
        return CompareResponse(player_a={}, player_b={}, metrics={"error": {"a": None, "b": "Need 2 players"}})
    result = ps.compare_players(db, parts[0], parts[1])
    return CompareResponse(
        player_a=result.get("player_a", {}),
        player_b=result.get("player_b", {}),
        metrics=result.get("metrics", {}),
    )


@router.get("/similar/{player_key}", response_model=list[PlayerDetail])
def similar_players(player_key: str, k: int = Query(5, le=25), db: Session = Depends(get_db)):
    return ps.similar_players(db, player_key, k)


@router.get("/{player_key}", response_model=PlayerDetail)
def get_player(player_key: str, season: Optional[int] = None, db: Session = Depends(get_db)):
    player = ps.get_player(db, player_key, season)
    if not player:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Player not found")
    return player
