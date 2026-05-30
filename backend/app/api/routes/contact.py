import logging

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas.contact import ContactRequest, ContactResponse
from app.services.email_service import send_contact_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse)
def submit_contact(body: ContactRequest):
    settings = get_settings()
    if not settings.resend_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured",
        )
    try:
        send_contact_email(
            name=body.name,
            email=str(body.email),
            subject=body.subject,
            message=body.message,
        )
    except Exception as exc:
        logger.exception("Failed to send contact email")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send message. Please try again later.",
        ) from exc
    return ContactResponse()
