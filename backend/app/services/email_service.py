"""Send contact form emails via Resend HTTP API."""
import html
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def send_contact_email(*, name: str, email: str, subject: str, message: str) -> str:
    settings = get_settings()
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")

    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_subject = html.escape(subject)
    safe_message = html.escape(message).replace("\n", "<br />")

    html_body = f"""
    <h2>Novo interesse - Scout Radar</h2>
    <p><strong>Nome:</strong> {safe_name}</p>
    <p><strong>E-mail:</strong> {safe_email}</p>
    <p><strong>Assunto:</strong> {safe_subject}</p>
    <hr />
    <p>{safe_message}</p>
    """

    text_body = (
        f"Novo interesse - Scout Radar\n\n"
        f"Nome: {name}\n"
        f"E-mail: {email}\n"
        f"Assunto: {subject}\n\n"
        f"{message}"
    )

    payload: dict = {
        "from": settings.contact_from_email,
        "to": [settings.contact_to_email],
        "subject": f"[Scout Radar] {subject}",
        "html": html_body,
        "text": text_body,
        "reply_to": email,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.HTTPError as exc:
        logger.exception("Resend HTTP request failed")
        raise RuntimeError(f"Email provider unreachable: {exc}") from exc

    if response.status_code >= 400:
        logger.error("Resend API %s: %s", response.status_code, response.text)
        try:
            err_json = response.json()
            detail = err_json.get("message") or err_json.get("error") or response.text
        except Exception:
            detail = response.text
        raise RuntimeError(f"Resend rejected email: {detail}")

    data = response.json()
    email_id = data.get("id", "")
    logger.info("Contact email sent id=%s to=%s", email_id, settings.contact_to_email)
    return email_id
