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
    except RuntimeError as exc:
        msg = str(exc)
        logger.error("Contact email failed: %s", msg)
        if "not configured" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servico de e-mail nao configurado. Defina RESEND_API_KEY no backend.",
            ) from exc
        if "Resend rejected" in msg:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Nao foi possivel enviar o e-mail. Verifique RESEND_API_KEY, "
                    "CONTACT_FROM_EMAIL (use onboarding@resend.dev no plano gratis) e "
                    "CONTACT_TO_EMAIL (deve ser o e-mail da sua conta Resend)."
                ),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nao foi possivel enviar. Tente novamente em instantes.",
        ) from exc
    except Exception as exc:
        logger.exception("Failed to send contact email")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nao foi possivel enviar. Tente novamente em instantes.",
        ) from exc
    return ContactResponse()
