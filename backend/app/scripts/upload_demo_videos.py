"""Upload landing demo videos from frontend/public/videos/ to the S3 bucket."""
import argparse
import mimetypes
import os
import sys
from pathlib import Path

from app.config import REPO_ROOT, get_settings
from app.services.storage_service import (
    DEMO_POSTER_FILES,
    DEMO_VIDEO_FILES,
    clear_s3_client_cache,
    test_connection,
    upload_file,
)

DEFAULT_LOCAL_DIR = REPO_ROOT / "frontend" / "public" / "videos"

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


def _resolve_local_dir(override: str | None) -> Path:
    if override:
        return Path(override).expanduser().resolve()
    env_dir = os.environ.get("DEMO_VIDEOS_DIR", "").strip()
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    return DEFAULT_LOCAL_DIR


def _print_env_hint() -> None:
    print("\nVariáveis aceitas (qualquer um dos grupos):", file=sys.stderr)
    print("  AWS_ENDPOINT_URL, AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION", file=sys.stderr)
    print("  S3_ENDPOINT_URL, S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION", file=sys.stderr)
    print("  ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION (Railway Add to Service)", file=sys.stderr)
    print("\nUpload a partir da sua máquina (recomendado):", file=sys.stderr)
    print("  cd backend", file=sys.stderr)
    print("  railway link", file=sys.stderr)
    print("  railway run python -m app.scripts.upload_demo_videos --check", file=sys.stderr)
    print("  railway run python -m app.scripts.upload_demo_videos", file=sys.stderr)
    print("\nNão use o Shell do container no Railway — os .mp4 não estão na imagem Docker.", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload Scout Radar demo videos to Railway Bucket")
    parser.add_argument("--check", action="store_true", help="Only test S3 credentials and bucket access")
    parser.add_argument("--dir", type=str, default=None, help="Folder with outliers.mp4, compare.mp4, chat.mp4")
    args = parser.parse_args()

    get_settings.cache_clear()
    clear_s3_client_cache()
    settings = get_settings()

    if not settings.s3_configured:
        print("ERRO: credenciais do bucket não encontradas.", file=sys.stderr)
        _print_env_hint()
        return 1

    ok, message = test_connection()
    print(message)
    if not ok:
        _print_env_hint()
        return 1

    if args.check:
        return 0

    local_dir = _resolve_local_dir(args.dir)
    if not local_dir.is_dir():
        print(f"ERRO: pasta não encontrada: {local_dir}", file=sys.stderr)
        print("Coloque outliers.mp4, compare.mp4, chat.mp4 nessa pasta.", file=sys.stderr)
        _print_env_hint()
        return 1

    targets = list(DEMO_VIDEO_FILES.values()) + list(DEMO_POSTER_FILES.values())
    uploaded = 0
    missing = []

    for name in targets:
        local = local_dir / name
        if not local.is_file():
            missing.append(name)
            continue
        size_mb = local.stat().st_size / (1024 * 1024)
        print(f"Uploading {name} ({size_mb:.1f} MB)...")
        try:
            upload_file(str(local), name, content_type=_content_type(local))
            print(f"  OK: {name}")
            uploaded += 1
        except Exception as exc:
            print(f"  FALHOU: {name} - {exc}", file=sys.stderr)
            return 1

    if missing:
        print("Opcional (não encontrado):", ", ".join(missing))

    if uploaded == 0:
        print("ERRO: nenhum vídeo .mp4 na pasta.", file=sys.stderr)
        return 1

    print(f"\nConcluído: {uploaded} arquivo(s) em '{settings.s3_bucket_name}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
