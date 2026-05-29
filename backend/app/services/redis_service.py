"""Redis-backed chat history and message feedback."""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        settings = get_settings()
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def _history_key(session_id: str) -> str:
    return f"chat:history:{session_id}"


def _feedback_key(message_id: str) -> str:
    return f"chat:feedback:{message_id}"


def _session_meta_key(session_id: str) -> str:
    return f"chat:session:{session_id}:meta"


def create_session_id() -> str:
    return str(uuid.uuid4())


def get_history(session_id: str, limit: Optional[int] = None) -> list[dict[str, Any]]:
    settings = get_settings()
    limit = limit or settings.chat_history_limit
    try:
        r = get_redis()
        raw = r.lrange(_history_key(session_id), -limit, -1)
        return [json.loads(item) for item in raw]
    except Exception as e:
        logger.warning("Redis get_history failed: %s", e)
        return []


def append_message(session_id: str, role: str, content: str, extra: Optional[dict] = None) -> str:
    settings = get_settings()
    message_id = str(uuid.uuid4())
    entry = {
        "id": message_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **(extra or {}),
    }
    try:
        r = get_redis()
        key = _history_key(session_id)
        r.rpush(key, json.dumps(entry, ensure_ascii=False))
        r.ltrim(key, -settings.chat_history_limit, -1)
        r.expire(key, settings.chat_session_ttl_seconds)
        r.set(_session_meta_key(session_id), json.dumps({"updated_at": entry["timestamp"]}), ex=settings.chat_session_ttl_seconds)
    except Exception as e:
        logger.warning("Redis append_message failed: %s", e)
    return message_id


def save_feedback(message_id: str, session_id: str, rating: str, comment: str = "") -> bool:
    if rating not in ("up", "down"):
        return False
    settings = get_settings()
    payload = {
        "message_id": message_id,
        "session_id": session_id,
        "rating": rating,
        "comment": comment[:500],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        r = get_redis()
        r.set(_feedback_key(message_id), json.dumps(payload), ex=settings.chat_session_ttl_seconds)
        r.sadd(f"chat:feedback:session:{session_id}", message_id)
        r.expire(f"chat:feedback:session:{session_id}", settings.chat_session_ttl_seconds)
        return True
    except Exception as e:
        logger.warning("Redis save_feedback failed: %s", e)
        return False


def get_feedback(message_id: str) -> Optional[dict]:
    try:
        r = get_redis()
        raw = r.get(_feedback_key(message_id))
        return json.loads(raw) if raw else None
    except Exception:
        return None


def format_history_for_llm(history: list[dict]) -> str:
    if not history:
        return ""
    lines = []
    for msg in history[-10:]:
        role = "Usuário" if msg.get("role") == "user" else "Assistente"
        lines.append(f"{role}: {msg.get('content', '')[:400]}")
    return "\n".join(lines)
