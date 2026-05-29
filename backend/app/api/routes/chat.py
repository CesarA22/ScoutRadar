from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.players import ChatRequest, ChatResponse, ExplorerInsightRequest, InsightResponse, PlayerInsightRequest
from app.services import chat_service, insights_service, player_service as ps

router = APIRouter(tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    result = chat_service.run_chat(db, body.message, body.context)
    return ChatResponse(**result)


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
