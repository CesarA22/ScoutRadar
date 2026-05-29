from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import FiltersResponse
from app.services import player_service as ps

router = APIRouter(prefix="/filters", tags=["filters"])


@router.get("", response_model=FiltersResponse)
def get_filters(db: Session = Depends(get_db)):
    data = ps.get_filters(db)
    return FiltersResponse(**data)
