import re
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import REPO_ROOT, get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import (
    AvailabilityResponse,
    LoginRequest,
    TokenResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

AVATAR_DIR = REPO_ROOT / "data" / "uploads" / "avatars"
ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _avatar_public_path(user_id: int, ext: str) -> str:
    return f"/uploads/avatars/{user_id}{ext}"


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username, User.is_active.is_(True)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/check-availability", response_model=AvailabilityResponse)
def check_availability(
    username: str | None = Query(default=None, max_length=64),
    email: str | None = Query(default=None, max_length=255),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username_available = True
    email_available = True

    if username and username.strip():
        uname = username.strip()
        taken = db.query(User).filter(User.username == uname, User.id != current_user.id).first()
        username_available = taken is None

    if email and email.strip():
        addr = email.strip().lower()
        taken = db.query(User).filter(User.email == addr, User.id != current_user.id).first()
        email_available = taken is None

    return AvailabilityResponse(
        username_available=username_available,
        email_available=email_available,
    )


@router.patch("/me", response_model=UpdateProfileResponse)
def update_me(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = current_user
    needs_password = any(
        [
            body.username is not None,
            body.email is not None,
            body.new_password is not None,
        ]
    )
    if needs_password:
        if not body.current_password or not verify_password(body.current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta")

    new_token: str | None = None

    if body.username is not None:
        uname = body.username.strip()
        if uname != user.username:
            taken = db.query(User).filter(User.username == uname, User.id != user.id).first()
            if taken:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username já está em uso")
            user.username = uname
            new_token = create_access_token(user.id)

    if body.email is not None:
        addr = body.email.strip().lower() if body.email.strip() else None
        if addr != (user.email or None):
            if addr:
                if not EMAIL_RE.match(addr):
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email inválido")
                taken = db.query(User).filter(User.email == addr, User.id != user.id).first()
                if taken:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já está em uso")
            user.email = addr

    if body.new_password is not None:
        user.password_hash = hash_password(body.new_password)

    if body.theme is not None:
        user.theme = body.theme

    if body.language is not None:
        user.language = body.language

    db.commit()
    db.refresh(user)
    return UpdateProfileResponse(user=user, access_token=new_token)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de imagem inválido")

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Imagem muito grande (máx. 2MB)")

    ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.content_type]
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    for old in AVATAR_DIR.glob(f"{current_user.id}.*"):
        old.unlink(missing_ok=True)

    filename = f"{current_user.id}{ext}"
    path = AVATAR_DIR / filename
    path.write_bytes(content)

    current_user.avatar_url = _avatar_public_path(current_user.id, ext)
    db.commit()
    db.refresh(current_user)
    return current_user
