"""S3-compatible storage (Railway Bucket / t3.storageapi.dev) for landing demo videos."""
import logging
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import get_settings

log = logging.getLogger(__name__)

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


def _is_railway_bucket_endpoint(endpoint: str) -> bool:
    host = urlparse(endpoint).netloc.lower()
    return "storageapi.dev" in host or "storage.railway.app" in host


def _resolve_region(raw: str, endpoint: str) -> str:
    """Railway Buckets must sign with region 'auto' (not iad/ams/etc.)."""
    if _is_railway_bucket_endpoint(endpoint):
        return "auto"
    return raw.strip() if raw and raw.strip() else "auto"


def _make_s3_client(addressing_style: str):
    settings = get_settings()
    endpoint = settings.s3_endpoint_url.rstrip("/")
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=_resolve_region(settings.s3_region, endpoint),
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": addressing_style},
        ),
    )


@lru_cache
def _s3_client():
    settings = get_settings()
    endpoint = settings.s3_endpoint_url.rstrip("/")
    style = "path" if _is_railway_bucket_endpoint(endpoint) else "virtual"
    return _make_s3_client(style)


@lru_cache
def _s3_client_virtual():
    return _make_s3_client("virtual")


def clear_s3_client_cache() -> None:
    _s3_client.cache_clear()
    _s3_client_virtual.cache_clear()


def _object_key(filename: str) -> str:
    return filename.lstrip("/")


def get_public_asset_url(filename: str) -> str | None:
    settings = get_settings()
    if not settings.s3_public_base_url:
        return None
    base = settings.s3_public_base_url.rstrip("/")
    return f"{base}/{_object_key(filename)}"


def list_object_keys(max_keys: int = 50) -> list[str]:
    settings = get_settings()
    if not settings.s3_configured:
        return []
    client = _s3_client()
    try:
        resp = client.list_objects_v2(Bucket=settings.s3_bucket_name, MaxKeys=max_keys)
        return [obj["Key"] for obj in resp.get("Contents", [])]
    except ClientError as exc:
        log.error("S3 list_objects_v2 failed: %s", exc)
        return []


def test_connection() -> tuple[bool, str]:
    settings = get_settings()
    if not settings.s3_configured:
        return False, "Missing S3/AWS bucket env vars (ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY)."

    client = _s3_client()
    try:
        client.list_objects_v2(Bucket=settings.s3_bucket_name, MaxKeys=1)
        region = _resolve_region(settings.s3_region, settings.s3_endpoint_url)
        return True, (
            f"OK - bucket '{settings.s3_bucket_name}' @ {settings.s3_endpoint_url} "
            f"(signing region={region})"
        )
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


def test_get_object(filename: str) -> tuple[bool, str]:
    """Verify GetObject works (not only ListBucket)."""
    try:
        obj = get_object_body(filename, range_header="bytes=0-0")
        obj["Body"].close()
        return True, "OK"
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        msg = exc.response.get("Error", {}).get("Message", str(exc))
        return False, f"{code}: {msg}"
    except Exception as exc:
        return False, str(exc)


def get_object_body(filename: str, range_header: str | None = None) -> dict:
    settings = get_settings()
    if not settings.s3_configured:
        raise RuntimeError("S3 storage is not configured")

    params: dict = {"Bucket": settings.s3_bucket_name, "Key": _object_key(filename)}
    if range_header and range_header.strip().lower().startswith("bytes="):
        params["Range"] = range_header.strip()

    last_exc: Exception | None = None
    for client in (_s3_client(), _s3_client_virtual()):
        try:
            return client.get_object(**params)
        except ClientError as exc:
            last_exc = exc
            code = exc.response.get("Error", {}).get("Code", "")
            if range_header and code in ("InvalidRange", "InvalidArgument"):
                params.pop("Range", None)
                try:
                    return client.get_object(**params)
                except ClientError as exc2:
                    last_exc = exc2
        except Exception as exc:
            last_exc = exc

    if last_exc:
        raise last_exc
    raise RuntimeError("S3 get_object failed")


def generate_presigned_get_url(filename: str, expires_seconds: int | None = None) -> str:
    settings = get_settings()
    if not settings.s3_configured:
        raise RuntimeError("S3 storage is not configured")

    expires = expires_seconds or settings.demo_video_presign_seconds
    key = _object_key(filename)
    params = {"Bucket": settings.s3_bucket_name, "Key": key}

    # Prefer path-style + region auto on Railway (virtual+iad caused AccessDenied)
    for client in (_s3_client(), _s3_client_virtual()):
        try:
            return client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expires,
            )
        except Exception as exc:
            log.warning("presign failed: %s", exc)

    raise RuntimeError("Could not generate presigned URL")


def upload_file(local_path: str, object_name: str, content_type: str | None = None) -> None:
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
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey"):
            log.warning("S3 object not found: bucket=%s key=%s", settings.s3_bucket_name, filename)
        else:
            log.error(
                "S3 head_object error: bucket=%s key=%s code=%s msg=%s",
                settings.s3_bucket_name,
                filename,
                code,
                exc.response.get("Error", {}).get("Message", str(exc)),
            )
        return False
    except Exception as exc:
        log.error("S3 object_exists unexpected error: %s", exc)
        return False


def s3_addressing_style_label() -> str:
    settings = get_settings()
    endpoint = settings.s3_endpoint_url.rstrip("/")
    return "path" if _is_railway_bucket_endpoint(endpoint) else "virtual"
