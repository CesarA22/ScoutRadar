from typing import Any, Optional

from pydantic import BaseModel, Field


class PlayerBase(BaseModel):
    player_key: str
    player: str
    team: str
    season: int
    position_group: str
    age: int
    minutes: int


class PlayerDetail(PlayerBase):
    metrics: dict[str, Any] = Field(default_factory=dict)
    umap_x: Optional[float] = None
    umap_y: Optional[float] = None
    cluster_id: Optional[int] = None
    cluster_prob: Optional[float] = None
    is_noise: Optional[int] = None
    rarity_score: Optional[float] = None
    impact_score: Optional[float] = None
    prospect_score: Optional[float] = None
    card: Optional[str] = None
    image_url: Optional[str] = None


class PlayerListResponse(BaseModel):
    items: list[PlayerDetail]
    total: int


class FiltersResponse(BaseModel):
    seasons: list[int]
    teams: list[str]
    clusters: list[int]
    position_groups: list[str]


class CompareResponse(BaseModel):
    player_a: dict[str, Any]
    player_b: dict[str, Any]
    metrics: dict[str, dict[str, Any]]


class DatasetStatusResponse(BaseModel):
    active: bool
    source: Optional[str] = None
    row_count: int = 0
    seasons: list[int] = Field(default_factory=list)
    created_at: Optional[str] = None


class MetricInfo(BaseModel):
    key: str
    label: str
    desc: str
    unit: str
    higher_is_better: Optional[bool] = None
    group: str


class ChatRequest(BaseModel):
    message: str
    session_id: str = ""
    context: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    answer: str
    plan: dict[str, Any]
    evidence: dict[str, Any]
    tools_called: list[str]
    postcheck_ok: bool
    audit: dict[str, Any]


class ChatHistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    feedback: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: list[ChatHistoryMessage]


class ChatFeedbackRequest(BaseModel):
    session_id: str
    message_id: str
    rating: str  # up | down
    comment: str = ""


class ExplorerInsightRequest(BaseModel):
    filter_desc: str = ""
    locale: str = "pt"
    top_prospects: str = ""
    by_team: str = ""
    by_position: str = ""


class PlayerInsightRequest(BaseModel):
    locale: str = "pt"


class CompareInsightRequest(BaseModel):
    keys: list[str] = Field(..., min_length=2, max_length=2)
    locale: str = "pt"


class InsightResponse(BaseModel):
    text: str
