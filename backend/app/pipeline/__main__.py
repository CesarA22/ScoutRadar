"""CLI entry point for data ingestion."""
import argparse
import logging
import sys

from app.db.session import SessionLocal
from app.pipeline.ingest import ingest_to_db

logging.basicConfig(level=logging.INFO)


def main():
    parser = argparse.ArgumentParser(description="ScoutRadar data ingestion")
    parser.add_argument("--seasons", nargs="+", type=int, default=[2023, 2024])
    parser.add_argument("--sample", action="store_true", help="Use synthetic sample data")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        ok = ingest_to_db(db, seasons=args.seasons, use_sample=args.sample)
        sys.exit(0 if ok else 1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
