from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    avatar_url: str | None = None
    theme: Literal["dark", "light"] = "dark"
    language: Literal["pt", "en", "es"] = "pt"

    model_config = {"from_attributes": True}


class AvailabilityResponse(BaseModel):
    username_available: bool
    email_available: bool


class UpdateProfileRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=64)
    email: str | None = Field(default=None, max_length=255)
    current_password: str | None = Field(default=None, min_length=1, max_length=128)
    new_password: str | None = Field(default=None, min_length=6, max_length=128)
    theme: Literal["dark", "light"] | None = None
    language: Literal["pt", "en", "es"] | None = None


class UpdateProfileResponse(BaseModel):
    user: UserResponse
    access_token: str | None = None
