from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import FiltersResponse, PlayerDetail
from app.services import player_service as ps

router = APIRouter(prefix="/outliers", tags=["outliers"])


@router.get("", response_model=list[PlayerDetail])
def get_outliers(
    metric: str = Query("prospect_score"),
    k: int = Query(25, le=50),
    season: Optional[list[int]] = Query(None),
    position_group: Optional[list[str]] = Query(None),
    team: Optional[list[str]] = Query(None),
    age_max: Optional[int] = Query(None),
    minutes_min: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return ps.top_outliers(
        db,
        metric=metric,
        k=k,
        seasons=season,
        position_groups=position_group,
        teams=team,
        age_max=age_max,
        minutes_min=minutes_min,
    )
