"""Policy gate - blocks prompt injection."""
import re
import unicodedata
from dataclasses import dataclass
from typing import Optional

from app.config import USER_INPUT_MAX_CHARS


@dataclass
class PolicyResult:
    allowed: bool
    reason: str
    sanitized_input: Optional[str] = None


DENY_PATTERNS = [
    r"ignore\s+(all\s+)?(instructions?|rules?)",
    r"disregard\s+.*?(instructions?|rules?)",
    r"reveal\s+(your\s+)?(system\s+)?prompt",
    r"show\s+(your\s+)?(system\s+)?prompt",
    r"what\s+are\s+your\s+(instructions?|rules?)",
    r"forget\s+(everything|all)",
    r"you\s+are\s+now\s+",
    r"pretend\s+you\s+are",
    r"act\s+as\s+if\s+you",
    r"roleplay\s+as",
    r"web\s+browsing|search\s+the\s+internet|google\s+it|busca\s+na\s+internet",
    r"run\s+(a\s+)?command|execute\s+(a\s+)?command|bash\s+|python\s+-c",
    r"eval\s*\(|exec\s*\(|subprocess",
    r"open\s+url|fetch\s+url|requests\.get",
    r"<!DOCTYPE|<\?xml|<script",
    r"\[\[.*?\]\]|<<.*?>>",
    r"\.env|API_KEY|SECRET",
]

DENY_REGEX = [re.compile(p, re.IGNORECASE) for p in DENY_PATTERNS]


def _sanitize_input(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Cc")
    return text.strip()[:USER_INPUT_MAX_CHARS]


def check_policy(user_input: str) -> PolicyResult:
    sanitized = _sanitize_input(user_input)
    if len(sanitized) < 2:
        return PolicyResult(allowed=False, reason="Mensagem muito curta.", sanitized_input=sanitized or None)
    for regex in DENY_REGEX:
        if regex.search(sanitized):
            return PolicyResult(allowed=False, reason="Solicitação fora do escopo do sistema.", sanitized_input=sanitized)
    return PolicyResult(allowed=True, reason="OK", sanitized_input=sanitized)
