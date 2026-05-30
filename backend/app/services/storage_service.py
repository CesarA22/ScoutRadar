"""S3-compatible storage (Railway Bucket / Tigris) for landing demo videos."""
from functools import lru_cache

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


@lru_cache
def _s3_client():
    settings = get_settings()
    # Railway Buckets (Tigris): virtual-hosted-style is required
    region = settings.s3_region if settings.s3_region and settings.s3_region != "auto" else "us-east-1"
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url.rstrip("/"),
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
    )


def _object_key(filename: str) -> str:
    return filename.lstrip("/")


def get_public_asset_url(filename: str) -> str | None:
    settings = get_settings()
    if not settings.s3_public_base_url:
        return None
    base = settings.s3_public_base_url.rstrip("/")
    return f"{base}/{_object_key(filename)}"


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
    settings = get_settings()
    if not settings.s3_configured:
        raise RuntimeError("S3 storage is not configured")

    extra: dict[str, str] = {}
    if content_type:
        extra["ContentType"] = content_type

    client = _s3_client()
    kwargs: dict = {}
    if extra:
        kwargs["ExtraArgs"] = extra
    client.upload_file(
        local_path,
        settings.s3_bucket_name,
        _object_key(object_name),
        **kwargs,
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
