"""Download demo MP4s from Railway bucket into public/videos/ (Docker build)."""
import os
import sys

import boto3
from botocore.client import Config

FILES = ("outliers.mp4", "compare.mp4", "chat.mp4")


def main() -> int:
    endpoint = os.environ.get("S3_ENDPOINT_URL", "").strip().strip('"').strip("'")
    bucket = os.environ.get("S3_BUCKET_NAME", "").strip().strip('"').strip("'")
    key_id = os.environ.get("S3_ACCESS_KEY_ID", "").strip().strip('"').strip("'")
    secret = os.environ.get("S3_SECRET_ACCESS_KEY", "").strip().strip('"').strip("'")
    region = os.environ.get("S3_REGION", "auto").strip().strip('"').strip("'") or "auto"
    out_dir = os.environ.get("OUT_DIR", "public/videos")

    if not all([endpoint, bucket, key_id, secret]):
        print("SKIP: S3_* build args not set — build continues; landing uses API fallback for videos.")
        return 0

    os.makedirs(out_dir, exist_ok=True)
    endpoint = endpoint.rstrip("/")
    if "storageapi.dev" in endpoint or "storage.railway.app" in endpoint:
        region = "auto"

    def _client(style: str):
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            region_name=region,
            config=Config(signature_version="s3v4", s3={"addressing_style": style}),
        )

    for name in FILES:
        dest = os.path.join(out_dir, name)
        print(f"Downloading {name}...")
        last_err = None
        for style in ("path", "virtual"):
            try:
                _client(style).download_file(bucket, name, dest)
                print(f"  OK {dest}")
                break
            except Exception as exc:
                last_err = exc
        else:
            raise last_err  # type: ignore[misc]

    return 0


if __name__ == "__main__":
    sys.exit(main())
