from pydantic import BaseModel


class DemoVideoUrlResponse(BaseModel):
    key: str
    url: str
    poster_url: str | None = None
    expires_in: int | None = None
