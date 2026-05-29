"""OpenAI insight generation."""
import json
from typing import Optional

from openai import OpenAI

from app.config import get_settings


def _client() -> Optional[OpenAI]:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)


def _lang_instruction(locale: str) -> str:
    if locale == "pt":
        return "Responda APENAS em português brasileiro."
    if locale == "es":
        return "Responde ÚNICAMENTE en español."
    return "Respond ONLY in English."


def generate_explorer_insights(top_prospects: str, by_team: str, by_position: str, filter_desc: str, locale: str = "pt") -> str:
    client = _client()
    if not client:
        return "OpenAI API key não configurada."
    lang = _lang_instruction(locale)
    prompt = f"""Você é um scout de futebol. Analise os dados e dê insights ESPECÍFICOS.
Filtros: {filter_desc}
TOP PROSPECTOS: {top_prospects}
POR TIME: {by_team}
POR POSIÇÃO: {by_position}
Seja objetivo. Máx 6 bullets. {lang}"""
    try:
        r = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], max_tokens=400)
        return (r.choices[0].message.content or "").strip()
    except Exception as e:
        return f"Erro ao gerar insights: {e}"


def generate_player_insight(player_name: str, metrics_text: str, locale: str = "pt") -> str:
    client = _client()
    if not client:
        return "OpenAI API key não configurada."
    lang = _lang_instruction(locale)
    prompt = f"Scouting insight for U23 player. Max 4 bullets. {lang}\nPLAYER: {player_name}\nMETRICS: {metrics_text}"
    try:
        r = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], max_tokens=200)
        return (r.choices[0].message.content or "").strip()
    except Exception as e:
        return f"Erro ao gerar relatório: {e}"


def generate_compare_insight(
    player_a: dict,
    player_b: dict,
    metrics: dict,
    locale: str = "pt",
) -> str:
    client = _client()
    if not client:
        return "OpenAI API key não configurada."
    lang = _lang_instruction(locale)
    payload = {
        "player_a": player_a,
        "player_b": player_b,
        "metrics": metrics,
    }
    prompt = f"""Você é um scout de futebol comparando dois jogadores U-23 do Brasileirão.
Analise perfil, métricas e trade-offs. Seja específico e objetivo. Máx 6 bullets. {lang}
DADOS: {json.dumps(payload, ensure_ascii=False, default=str)[:3500]}"""
    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=450,
        )
        return (r.choices[0].message.content or "").strip()
    except Exception as e:
        return f"Erro ao gerar comparação: {e}"
