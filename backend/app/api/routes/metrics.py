from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.metrics.registry import METRIC_INFO
from app.schemas.players import MetricInfo

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=list[MetricInfo])
def list_metrics():
    return [
        MetricInfo(
            key=k,
            label=v.get("label", k),
            desc=v.get("desc", ""),
            unit=v.get("unit", ""),
            higher_is_better=v.get("higher_is_better"),
            group=v.get("group", ""),
        )
        for k, v in METRIC_INFO.items()
    ]
