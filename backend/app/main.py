import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.deps import get_current_user
from app.api.routes import auth, chat, contact, dataset, demo_videos, filters, health, metrics, outliers, players
from app.config import REPO_ROOT, get_settings
from app.services import storage_service as storage

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.s3_configured:
        ok, msg = storage.test_connection()
        log.info("S3 bucket=%s endpoint=%s list_ok=%s (%s)", settings.s3_bucket_name, settings.s3_endpoint_url, ok, msg)
        if ok:
            get_ok, get_msg = storage.test_get_object("chat.mp4")
            log.info("S3 get_object chat.mp4: %s (%s)", get_ok, get_msg)
    else:
        log.warning("S3 not configured — demo videos will fail until bucket is linked to backend")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="ScoutRadar API", version="2.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    protected = [Depends(get_current_user)]

    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(contact.router, prefix="/api/v1")
    app.include_router(demo_videos.router, prefix="/api/v1")
    app.include_router(players.router, prefix="/api/v1", dependencies=protected)
    app.include_router(outliers.router, prefix="/api/v1", dependencies=protected)
    app.include_router(filters.router, prefix="/api/v1", dependencies=protected)
    app.include_router(metrics.router, prefix="/api/v1", dependencies=protected)
    app.include_router(dataset.router, prefix="/api/v1", dependencies=protected)
    app.include_router(chat.router, prefix="/api/v1", dependencies=protected)

    uploads_dir = Path(REPO_ROOT) / "data" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    return app


app = create_app()
