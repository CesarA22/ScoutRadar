"""Answer writer - LLM with evidence only."""
import json
import logging
from typing import Any

from openai import OpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)


def _build_writer_prompt(question: str, plan: dict, evidence: Any, ai_insight: str = "", chat_history: str = "") -> str:
    ai_block = f"\nCONTEXTO:\n{ai_insight[:600]}\n" if ai_insight and len(ai_insight) > 20 else ""
    history_block = f"\nHISTÓRICO RECENTE:\n{chat_history}\n" if chat_history else ""
    return f"""Você é um assistente de scout de futebol. Responda APENAS com base nas evidências.{ai_block}{history_block}
PERGUNTA: {question}
PLANO: {json.dumps(plan, ensure_ascii=False, default=str)}
EVIDÊNCIA: {json.dumps(evidence, ensure_ascii=False, default=str)}
REGRAS: Use SOMENTE a evidência. Inclua bloco "Fontes (dataset):" no final. Temporadas 2023/2024 apenas."""


def run_writer(question: str, plan: dict, evidence: Any, ai_insight: str = "", chat_history: str = "") -> str:
    settings = get_settings()
    if not settings.openai_api_key:
        return "OpenAI API key não configurada."

    prompt = _build_writer_prompt(question, plan, evidence, ai_insight, chat_history)
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.exception("Writer error: %s", e)
        return f"Erro ao gerar resposta: {e}"
