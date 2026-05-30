"""S3-compatible storage (Railway Bucket / Tigris) for landing demo videos."""
from functools import lru_cache
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import get_settings

DEMO_VIDEO_FILES: dict[str, str] = {
    "outliers": "outliers.mp4",
    "compare": "compare.mp4",
    "chat": "chat.mp4",
}

DEMO_POSTER_FILES: dict[str, str] = {
    "outliers": "outliers-poster.jpg",
    "compare": "compare-poster.jpg",
    "chat": "chat-poster.jpg",
}


def _resolve_region(raw: str) -> str:
    """Railway Buckets expect region 'auto'; do not remap to us-east-1."""
    return raw.strip() if raw and raw.strip() else "auto"


@lru_cache
def _s3_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url.rstrip("/"),
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=_resolve_region(settings.s3_region),
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "virtual"},
        ),
    )


def clear_s3_client_cache() -> None:
    _s3_client.cache_clear()


def _object_key(filename: str) -> str:
    return filename.lstrip("/")


def get_public_asset_url(filename: str) -> str | None:
    settings = get_settings()
    if not settings.s3_public_base_url:
        return None
    base = settings.s3_public_base_url.rstrip("/")
    return f"{base}/{_object_key(filename)}"


def test_connection() -> tuple[bool, str]:
    """Verify credentials and bucket access."""
    settings = get_settings()
    if not settings.s3_configured:
        return False, "Missing S3/AWS bucket env vars (ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY)."

    client = _s3_client()
    try:
        client.list_objects_v2(Bucket=settings.s3_bucket_name, MaxKeys=1)
        return True, f"OK - bucket '{settings.s3_bucket_name}' @ {settings.s3_endpoint_url}"
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        msg = exc.response.get("Error", {}).get("Message", str(exc))
        if code == "SignatureDoesNotMatch":
            return False, (
                "SignatureDoesNotMatch — Access Key ou Secret incorretos/expirados. "
                "No Railway: bucket > Credentials > copie de novo ou use Add to Service no backend."
            )
        if code in ("AccessDenied", "403"):
            return False, f"AccessDenied — credenciais sem permissão no bucket: {msg}"
        return False, f"{code}: {msg}"
    except Exception as exc:
        return False, str(exc)


def generate_presigned_get_url(filename: str, expires_seconds: int | None = None) -> str:
    settings = get_settings()
    if not settings.s3_configured:
        raise RuntimeError("S3 storage is not configured")

    client = _s3_client()
    expires = expires_seconds or settings.demo_video_presign_seconds
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": _object_key(filename)},
        ExpiresIn=expires,
    )


def upload_file(local_path: str, object_name: str, content_type: str | None = None) -> None:
    """Upload via PutObject (single request — avoids multipart signature issues)."""
    settings = get_settings()
    if not settings.s3_configured:
        raise RuntimeError("S3 storage is not configured")

    path = Path(local_path)
    if not path.is_file():
        raise FileNotFoundError(local_path)

    extra: dict[str, str] = {}
    if content_type:
        extra["ContentType"] = content_type

    client = _s3_client()
    with path.open("rb") as body:
        client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=_object_key(object_name),
            Body=body,
            **extra,
        )


def object_exists(filename: str) -> bool:
    settings = get_settings()
    if not settings.s3_configured:
        return False
    client = _s3_client()
    try:
        client.head_object(Bucket=settings.s3_bucket_name, Key=_object_key(filename))
        return True
    except ClientError:
        return False
