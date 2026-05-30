from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas.demo_videos import DemoVideoUrlResponse
from app.services import storage_service as storage

router = APIRouter(prefix="/demo-videos", tags=["demo-videos"])

ALLOWED_KEYS = frozenset(storage.DEMO_VIDEO_FILES.keys())


@router.get("/{key}", response_model=DemoVideoUrlResponse)
def get_demo_video_url(key: str):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown demo video")

    settings = get_settings()
    filename = storage.DEMO_VIDEO_FILES[key]
    poster_name = storage.DEMO_POSTER_FILES.get(key)

    public_video = storage.get_public_asset_url(filename)
    public_poster = storage.get_public_asset_url(poster_name) if poster_name else None

    if public_video:
        return DemoVideoUrlResponse(
            key=key,
            url=public_video,
            poster_url=public_poster,
        )

    if not settings.s3_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video storage is not configured",
        )

    if not storage.object_exists(filename):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video not uploaded yet: {filename}",
        )

    url = storage.generate_presigned_get_url(filename)
    poster_url = None
    if poster_name and storage.object_exists(poster_name):
        poster_url = storage.generate_presigned_get_url(poster_name)

    return DemoVideoUrlResponse(
        key=key,
        url=url,
        poster_url=poster_url,
        expires_in=settings.demo_video_presign_seconds,
    )
