"""Idempotent seed for the default admin user."""
import sys

from app.config import get_settings
from app.core.security import hash_password
from app.db.models import User
from app.db.session import SessionLocal


def seed_user() -> int:
    settings = get_settings()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.seed_username).first()
        if existing:
            existing.password_hash = hash_password(settings.seed_password)
            existing.is_active = True
            db.commit()
            print(f"Updated user: {settings.seed_username}")
            return 0

        user = User(
            username=settings.seed_username,
            password_hash=hash_password(settings.seed_password),
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Created user: {settings.seed_username}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(seed_user())
