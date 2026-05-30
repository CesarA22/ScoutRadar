"""Send contact form emails via Resend."""
import logging

import resend

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_contact_email(*, name: str, email: str, subject: str, message: str) -> None:
    settings = get_settings()
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = settings.resend_api_key

    html_body = f"""
    <h2>Novo interesse — Scout Radar</h2>
    <p><strong>Nome:</strong> {name}</p>
    <p><strong>E-mail:</strong> {email}</p>
    <p><strong>Assunto:</strong> {subject}</p>
    <hr />
    <p>{message.replace(chr(10), '<br />')}</p>
    """

    resend.Emails.send({
        "from": settings.contact_from_email,
        "to": [settings.contact_to_email],
        "reply_to": email,
        "subject": f"[Scout Radar] {subject}",
        "html": html_body,
    })
