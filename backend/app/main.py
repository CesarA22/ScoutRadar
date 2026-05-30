from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import get_current_user
from app.api.routes import auth, chat, contact, dataset, demo_videos, filters, health, metrics, outliers, players
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
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

    return app


app = create_app()
