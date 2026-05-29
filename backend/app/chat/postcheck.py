"""Post-check response compliance."""
import re
from typing import Tuple

from app.config import METRICS_ALLOWLIST, SEASONS_ALLOWED


def check_response(text: str) -> Tuple[bool, str]:
    if not text or not isinstance(text, str):
        return False, "Resposta vazia."
    if "Fontes (dataset)" not in text and "fontes" not in text.lower():
        return False, "Falta bloco 'Fontes (dataset)'."
    year_match = re.findall(r"\b(19\d{2}|20[0-1]\d|202[5-9])\b", text)
    for y in year_match:
        yr = int(y)
        if yr not in SEASONS_ALLOWED and 2015 <= yr <= 2030:
            return False, f"Menção a temporada fora do escopo: {yr}"
    words = set(re.findall(r"\b[a-z_]+_per90\b|\b[a-z_]+_score\b", text.lower()))
    invalid = words - METRICS_ALLOWLIST
    known_invalid = {"heatmap", "expected_goals_against", "penalties_saved"}
    if invalid & known_invalid:
        return False, f"Métricas fora do escopo: {invalid}"
    return True, ""
