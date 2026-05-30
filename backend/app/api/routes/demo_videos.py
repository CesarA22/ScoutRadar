import logging

from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse, StreamingResponse

from app.config import get_settings
from app.schemas.demo_videos import DemoVideoUrlResponse
from app.services import storage_service as storage

log = logging.getLogger(__name__)

router = APIRouter(prefix="/demo-videos", tags=["demo-videos"])

ALLOWED_KEYS = frozenset(storage.DEMO_VIDEO_FILES.keys())

CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _content_type(filename: str) -> str:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return CONTENT_TYPES.get(ext, "application/octet-stream")


def _stream_path(key: str, kind: str = "stream") -> str:
    return f"/api/v1/demo-videos/{key}/{kind}"


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

    sample_presign = None
    presign_error = None
    get_object_ok = None
    get_object_error = None
    if ok and storage.DEMO_VIDEO_FILES.get("chat"):
        try:
            sample_presign = storage.generate_presigned_get_url("chat.mp4")[:160] + "..."
        except Exception as exc:
            presign_error = str(exc)
        get_object_ok, get_object_error = storage.test_get_object("chat.mp4")

    return {
        "configured": True,
        "connection_ok": ok,
        "connection_message": message,
        "bucket": settings.s3_bucket_name,
        "endpoint": settings.s3_endpoint_url,
        "region": settings.s3_region,
        "addressing_style": storage.s3_addressing_style_label(),
        "signing_region": storage._resolve_region(settings.s3_region, settings.s3_endpoint_url),
        "listed_sample": listed,
        "demo_files": demo_files,
        "demo_found_in_list": found,
        "sample_presign_prefix": sample_presign,
        "presign_error": presign_error,
        "get_object_ok": get_object_ok,
        "get_object_error": get_object_error,
        "recommended_playback": "redirect to presigned URL at /api/v1/demo-videos/{key}/stream",
    }


def _redirect_to_presigned(filename: str) -> RedirectResponse:
    """Redirect browser to S3 presigned URL — avoids proxy 502 on large video bodies."""
    try:
        url = storage.generate_presigned_get_url(filename)
    except Exception as exc:
        log.exception("Failed to presign %s", filename)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not sign video URL: {exc}",
        ) from exc
    return RedirectResponse(url=url, status_code=307)


def _s3_stream_response(filename: str, request: Request) -> StreamingResponse:
    range_header = request.headers.get("range")
    try:
        obj = storage.get_object_body(filename, range_header=range_header)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        msg = exc.response.get("Error", {}).get("Message", str(exc))
        log.error("S3 get_object failed for %s: %s %s", filename, code, msg)
        if code in ("AccessDenied", "403"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Access denied no bucket. No Railway: bucket > Add to Service no backend, "
                    "REGION=auto, e variáveis sem aspas."
                ),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not read video from storage: {code}: {msg}",
        ) from exc
    except Exception as exc:
        log.exception("S3 get_object failed for %s", filename)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not read video from storage: {exc}",
        ) from exc

    body = obj["Body"]
    content_type = obj.get("ContentType") or _content_type(filename)
    status_code = status.HTTP_206_PARTIAL_CONTENT if range_header and obj.get("ContentRange") else status.HTTP_200_OK

    headers: dict[str, str] = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
    }
    if obj.get("ContentLength") is not None:
        headers["Content-Length"] = str(obj["ContentLength"])
    if obj.get("ContentRange"):
        headers["Content-Range"] = obj["ContentRange"]

    return StreamingResponse(
        body.iter_chunks(chunk_size=1024 * 256),
        status_code=status_code,
        media_type=content_type,
        headers=headers,
    )


@router.get("/{key}/stream")
def stream_demo_video(key: str, request: Request):
    """Stream video bytes from bucket via backend (reliable for private Railway buckets)."""
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown demo video")

    settings = get_settings()
    if not settings.s3_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video storage is not configured",
        )

    filename = storage.DEMO_VIDEO_FILES[key]
    if request.query_params.get("redirect") == "1":
        return _redirect_to_presigned(filename)
    return _s3_stream_response(filename, request)


@router.get("/{key}/poster")
def stream_demo_poster(key: str, request: Request):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown demo video")

    poster_name = storage.DEMO_POSTER_FILES.get(key)
    if not poster_name:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No poster for this video")

    settings = get_settings()
    if not settings.s3_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Video storage is not configured")

    return _s3_stream_response(poster_name, request)


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

    # Backend proxy: same-origin /api/.../stream (frontend proxies /api to backend)
    poster_url = None
    if poster_name and storage.object_exists(poster_name):
        poster_url = _stream_path(key, "poster")
    return DemoVideoUrlResponse(
        key=key,
        url=_stream_path(key, "stream"),
        poster_url=poster_url,
    )
