import logging

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas.demo_videos import DemoVideoUrlResponse
from app.services import storage_service as storage

log = logging.getLogger(__name__)

router = APIRouter(prefix="/demo-videos", tags=["demo-videos"])

ALLOWED_KEYS = frozenset(storage.DEMO_VIDEO_FILES.keys())


@router.get("/storage-check")
def storage_check():
    """Public diagnostic — confirms bucket env and whether demo objects are visible."""
    settings = get_settings()
    if not settings.s3_configured:
        return {
            "configured": False,
            "detail": "Missing ENDPOINT, BUCKET, ACCESS_KEY_ID, or SECRET_ACCESS_KEY on backend service.",
        }

    ok, message = storage.test_connection()
    listed = storage.list_object_keys(max_keys=20) if ok else []
    demo_files = {k: storage.DEMO_VIDEO_FILES[k] for k in ALLOWED_KEYS}
    found = {k: storage.DEMO_VIDEO_FILES[k] in listed for k in ALLOWED_KEYS}

    return {
        "configured": True,
        "connection_ok": ok,
        "connection_message": message,
        "bucket": settings.s3_bucket_name,
        "endpoint": settings.s3_endpoint_url,
        "region": settings.s3_region,
        "listed_sample": listed,
        "demo_files": demo_files,
        "demo_found_in_list": found,
    }


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

    try:
        url = storage.generate_presigned_get_url(filename)
    except Exception as exc:
        log.exception("Failed to presign demo video %s", filename)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not generate video URL: {exc}",
        ) from exc

    poster_url = None
    if poster_name:
        try:
            if storage.object_exists(poster_name):
                poster_url = storage.generate_presigned_get_url(poster_name)
        except Exception:
            log.debug("Poster presign skipped for %s", poster_name, exc_info=True)

    return DemoVideoUrlResponse(
        key=key,
        url=url,
        poster_url=poster_url,
        expires_in=settings.demo_video_presign_seconds,
    )
