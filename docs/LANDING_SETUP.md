# Scout Radar — Landing, Login e Contato

Guia para configurar a landing page, vídeos de demo, login e formulário de interesse.

---

## 1. Login (usuário padrão)

O backend cria/atualiza automaticamente o usuário no startup (`seed_user`).

| Campo    | Valor padrão   |
|----------|----------------|
| Usuário  | `cesar`        |
| Senha    | `admin@6347`   |

Variáveis opcionais no `.env` / Railway (backend):

```env
SEED_USER=cesar
SEED_PASSWORD=admin@6347
JWT_SECRET=<string longa e aleatória em produção>
```

**Fluxo:** Landing (`/`) é pública → **Entrar** → `/login` → após login, acesso a `/explorer`, `/outliers`, `/compare`, `/chat`.

---

## 2. E-mail do formulário “Estou interessado” (Resend — grátis)

Usamos [Resend](https://resend.com) (plano free: ~100 e-mails/dia).

### Passo a passo

1. Crie conta em https://resend.com  
2. **API Keys** → Create API Key → copie a chave  
3. No Railway (serviço **backend**) ou no `.env` local:

```env
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO_EMAIL=cesaraugusto213@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

4. **Por que `onboarding@resend.dev`?**  
   No plano gratuito, sem verificar domínio, você só pode enviar **para o e-mail da sua conta Resend** usando esse remetente de teste. Se sua conta Resend for `cesaraugusto213@gmail.com`, os e-mails do formulário chegam nessa caixa. O campo **reply-to** do visitante permite responder direto a quem preencheu o form.

5. Para enviar de um domínio próprio (`contato@seudominio.com`), adicione e verifique o domínio no painel Resend e altere `CONTACT_FROM_EMAIL`.

6. Reinicie o backend após configurar `RESEND_API_KEY`.

---

## 3. Vídeos de demo (Railway Bucket)

Os vídeos **não** vão para o GitHub. Use o bucket do Railway ou arquivos locais.

### Arquivos esperados

| Arquivo        | Feature    |
|----------------|------------|
| `outliers.mp4` | Outliers   |
| `compare.mp4`  | Comparação |
| `chat.mp4`     | Chat IA    |

Posters opcionais (leves): `outliers-poster.jpg`, `compare-poster.jpg`, `chat-poster.jpg`

### Local (desenvolvimento)

Coloque os arquivos em:

```
frontend/public/videos/
```

A pasta `frontend/public/videos/` está no `.gitignore` (exceto `.gitkeep`).

Deixe `VITE_VIDEO_BASE_URL` vazio no `frontend/.env`.

### Railway Bucket (S3-compatible)

Credenciais no painel Railway → Bucket → **S3-compatible Credentials**.

No **backend** (`.env` local ou variáveis Railway):

```env
S3_ENDPOINT_URL=https://t3.storageapi.dev
S3_BUCKET_NAME=stashed-bottle-lcoxrwa1zs
S3_ACCESS_KEY_ID=<sua access key>
S3_SECRET_ACCESS_KEY=<sua secret key>
S3_REGION=auto
# Deixe vazio se o bucket for privado (padrão) — URLs presigned via API
S3_PUBLIC_BASE_URL=
```

**URL virtual-hosted** (referência): `https://<bucket>.t3.storageapi.dev/<arquivo>.mp4`

Buckets privados retornam **403** em URL direta. O Scout Radar usa `GET /api/v1/demo-videos/{outliers|compare|chat}` para gerar **URLs presigned** (válidas ~1h). No frontend, **não** defina `VITE_VIDEO_BASE_URL` — os vídeos vêm do backend automaticamente.

#### Upload dos vídeos

1. Coloque os arquivos em `frontend/public/videos/` (local, gitignored).  
2. No painel Railway, bucket → **Add to Service** → serviço **backend** → estilo **AWS SDK (Generic)** → **Add Variables** (injeta `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, etc.).  
3. No `.env` local, copie de novo da aba **Credentials** (não use print antigo). Se a secret tiver `+`, use aspas:
   `S3_SECRET_ACCESS_KEY="tsec_..."`
4. Upload:

```bash
cd backend
pip install -e ".[dev]"
python -m app.scripts.upload_demo_videos
```

Ou via Docker:

```bash
docker compose exec backend python -m app.scripts.upload_demo_videos
```

**Erro `SignatureDoesNotMatch`?** Credenciais incorretas ou secret truncada. Gere novas keys no Railway ou use **Add to Service**.

**Frontend:** deixe `VITE_VIDEO_BASE_URL` vazio — a landing pede URLs presigned em `/api/v1/demo-videos/outliers` (etc.).

#### Opcional: bucket 100% público

Se no futuro os objetos forem `public-read`, defina `S3_PUBLIC_BASE_URL=https://<bucket>.t3.storageapi.dev` **ou** `VITE_VIDEO_BASE_URL` no frontend (build-time) para URLs diretas sem presign.

---

## 4. Variáveis no Railway (resumo)

### Backend

| Variável            | Obrigatório | Descrição                          |
|---------------------|-------------|------------------------------------|
| `DATABASE_URL`      | Sim         | Postgres (plugin)                  |
| `JWT_SECRET`        | Sim (prod)  | Segredo longo para tokens          |
| `RESEND_API_KEY`    | Para contato| API Resend                         |
| `CONTACT_TO_EMAIL`  | Recomendado | Seu e-mail                         |
| `CONTACT_FROM_EMAIL`| Recomendado | `onboarding@resend.dev` (teste)    |
| `CORS_ORIGINS`      | Sim         | URL pública do frontend            |
| `SEED_USER` / `SEED_PASSWORD` | Opcional | Login padrão              |

### Frontend

| Variável               | Descrição                    |
|------------------------|------------------------------|
| `VITE_API_URL`         | URL pública do backend       |
| `VITE_VIDEO_BASE_URL`  | Opcional — só se bucket for público; senão use presigned (backend S3_*) |
| `S3_*` (backend)       | Credenciais do bucket Railway |

---

## 5. Migrations

Na primeira subida com auth:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed_user
```

O `docker-compose` e o Railway já rodam migration + seed no start.
