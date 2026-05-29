from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import (
    ChatFeedbackRequest,
    ChatHistoryResponse,
    ChatHistoryMessage,
    ChatRequest,
    ChatResponse,
    ExplorerInsightRequest,
    InsightResponse,
    PlayerInsightRequest,
)
from app.services import chat_service, insights_service, player_service as ps
from app.services import redis_service as redis_svc

router = APIRouter(tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    result = chat_service.run_chat(db, body.message, body.context, body.session_id)
    return ChatResponse(**result)


@router.get("/chat/history/{session_id}", response_model=ChatHistoryResponse)
def chat_history(session_id: str):
    messages = redis_svc.get_history(session_id)
    enriched = []
    for msg in messages:
        fb = redis_svc.get_feedback(msg["id"])
        enriched.append(ChatHistoryMessage(
            id=msg["id"],
            role=msg["role"],
            content=msg["content"],
            timestamp=msg.get("timestamp", ""),
            feedback=fb.get("rating") if fb else None,
        ))
    return ChatHistoryResponse(session_id=session_id, messages=enriched)


@router.post("/chat/feedback")
def chat_feedback(body: ChatFeedbackRequest):
    ok = redis_svc.save_feedback(body.message_id, body.session_id, body.rating, body.comment)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid feedback")
    return {"ok": True, "message_id": body.message_id, "rating": body.rating}


@router.post("/insights/explorer", response_model=InsightResponse)
def explorer_insights(body: ExplorerInsightRequest, db: Session = Depends(get_db)):
    if not body.top_prospects:
        items = ps.top_outliers(db, k=10)
        body.top_prospects = ", ".join(f"{i['player']} ({i.get('prospect_score', 0):.2f})" for i in items[:10])
    text = insights_service.generate_explorer_insights(
        body.top_prospects, body.by_team, body.by_position, body.filter_desc, body.locale
    )
    return InsightResponse(text=text)


@router.post("/insights/player/{player_key}", response_model=InsightResponse)
def player_insight(player_key: str, body: PlayerInsightRequest, db: Session = Depends(get_db)):
    player = ps.get_player(db, player_key)
    if not player:
        return InsightResponse(text="Jogador não encontrado.")
    metrics = player.get("metrics", {})
    metrics_text = ", ".join(f"{k}={v}" for k, v in list(metrics.items())[:12])
    text = insights_service.generate_player_insight(player["player"], metrics_text, body.locale)
    return InsightResponse(text=text)
