"""Upload landing demo videos from frontend/public/videos/ to the S3 bucket."""
import mimetypes
import sys
from pathlib import Path

from app.config import REPO_ROOT, get_settings
from app.services.storage_service import DEMO_POSTER_FILES, DEMO_VIDEO_FILES, upload_file

LOCAL_DIR = REPO_ROOT / "frontend" / "public" / "videos"

CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _content_type(path: Path) -> str:
    ext = path.suffix.lower()
    return CONTENT_TYPES.get(ext) or mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def main() -> int:
    settings = get_settings()
    if not settings.s3_configured:
        print("Configure S3_ENDPOINT_URL, S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY in .env", file=sys.stderr)
        return 1

    if not LOCAL_DIR.is_dir():
        print(f"Missing folder: {LOCAL_DIR}", file=sys.stderr)
        print("Add outliers.mp4, compare.mp4, chat.mp4 (and optional posters).", file=sys.stderr)
        return 1

    targets = list(DEMO_VIDEO_FILES.values()) + list(DEMO_POSTER_FILES.values())
    uploaded = 0
    missing = []

    for name in targets:
        local = LOCAL_DIR / name
        if not local.is_file():
            missing.append(name)
            continue
        upload_file(str(local), name, content_type=_content_type(local))
        print(f"Uploaded: {name}")
        uploaded += 1

    if missing:
        print("Skipped (not found):", ", ".join(missing))

    if uploaded == 0:
        print("No files uploaded.", file=sys.stderr)
        return 1

    base = settings.s3_public_base_url or f"https://{settings.s3_bucket_name}.t3.storageapi.dev"
    print(f"Done ({uploaded} file(s)). Bucket base: {base}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
