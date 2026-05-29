from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import DatasetStatusResponse
from app.services import player_service as ps

router = APIRouter(prefix="/dataset", tags=["dataset"])


@router.get("/status", response_model=DatasetStatusResponse)
def dataset_status(db: Session = Depends(get_db)):
    run = ps.get_active_run(db)
    if not run:
        return DatasetStatusResponse(active=False, row_count=0)
    return DatasetStatusResponse(
        active=True,
        source=run.source,
        row_count=run.row_count,
        seasons=run.seasons or [],
        created_at=run.created_at.isoformat() if run.created_at else None,
    )
