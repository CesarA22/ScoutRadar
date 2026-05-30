# Scout Radar

Plataforma de scouting U-23 do Brasileirão com visualização interativa (UMAP), outliers, comparação e chatbot grounded com guardrails.

**Stack:** React + FastAPI + PostgreSQL + Docker

---

## Arquitetura

```
React SPA  →  FastAPI REST API  →  PostgreSQL
                    ↓
              OpenAI (chat + insights)

Ingestão offline (CLI): FBref/sample → Postgres
```

Os dados dos jogadores ficam **persistidos no PostgreSQL**. A API só lê do banco — deploy/restart não reprocessa FBref.

---

## Setup (Docker — recomendado)

```bash
cp .env.example .env
# Edite OPENAI_API_KEY se quiser chat/insights IA

docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.pipeline --sample
```

Acesse:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:8000
- **Health:** http://localhost:8000/health
- **Docs:** http://localhost:8000/docs

---

## Ingestão de dados

```bash
# Dados sintéticos (dev)
docker compose exec backend python -m app.pipeline --sample

# Dados reais FBref (requer internet + soccerdata)
docker compose exec backend python -m app.pipeline --seasons 2023 2024

# Migrar parquets legados de data/processed/
docker compose exec backend python scripts/migrate_parquet.py
```

---

## Desenvolvimento local (sem Docker)

### Backend

```bash
cd backend
pip install -e ".[dev]"
# Postgres rodando localmente
export DATABASE_URL=postgresql+psycopg://scout:scout@localhost:5432/scoutradar
alembic upgrade head
python -m app.pipeline --sample
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Testes

```bash
cd backend
pytest tests/ -v
```

---

## Deploy Railway

1. Crie um projeto Railway com **PostgreSQL plugin**
2. **Backend service:** root directory `backend/`, Dockerfile auto-detectado
   - Variáveis: `OPENAI_API_KEY`, `CORS_ORIGINS` (URL do frontend)
   - `DATABASE_URL` é injetada automaticamente pelo plugin Postgres
3. **Frontend service:** root directory `frontend/`, `Dockerfile.prod`
   - **Start Command:** `/docker-entrypoint.sh` (ou vazio — **nunca** `npx vite preview`)
   - **Runtime:** `BACKEND_URL=https://seu-backend.up.railway.app` (sem barra final)
   - **Build:** `VITE_API_URL` vazio (same-origin `/api` via nginx)
4. (Opcional) Cron job semanal: `python -m app.pipeline --seasons 2023 2024`

---

## API Endpoints

| Rota | Descrição |
|------|-----------|
| `GET /api/v1/players` | Lista jogadores com filtros |
| `GET /api/v1/players/{key}` | Detalhe do jogador |
| `GET /api/v1/players/search?q=` | Busca fuzzy |
| `GET /api/v1/players/compare?keys=` | Comparação |
| `GET /api/v1/outliers` | Top outliers |
| `GET /api/v1/filters` | Opções de filtro |
| `GET /api/v1/dataset/status` | Status do dataset |
| `POST /api/v1/chat` | Chat grounded |
| `POST /api/v1/insights/explorer` | Insights IA do explorer |
| `POST /api/v1/insights/player/{key}` | Insight de jogador |

---

## Estrutura do monorepo

```
ScoutRadar/
├── backend/          # FastAPI + SQLAlchemy + Alembic + pipeline
├── frontend/         # React + Vite + Tailwind + Plotly
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```
