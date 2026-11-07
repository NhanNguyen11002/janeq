# JaneQ

Development setup for the JaneQ MCQ app. The FastAPI backend serves questions from
`backend/data/questions_en.json`; the React frontend runs with Vite hot module replacement.

## Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

The backend and frontend source directories are bind-mounted for live reload.
Question data is mounted with the backend source, and exported attempts can be
written to `backend/exports/`.

## API

- `POST /api/auth/login` — authenticate through DummyJSON and return the user and access token.
- `GET /api/categories` — list categories and question counts.
- `GET /api/questions?category=...` — list questions without correct answers.
- `POST /api/attempts` — submit and score an attempt. Requires `Authorization: Bearer <token>`.
- `GET /api/attempts` — list the authenticated user's attempt history.
- `GET /api/attempts/{attempt_id}` — read one of the authenticated user's attempts.
- `GET /api/attempts/{attempt_id}/export` — download an attempt as JSON.

Each submitted attempt is saved as `backend/exports/{attemptId}.json`.
`backend/data/attempts.json` maps user IDs to their attempt IDs:

```json
{
  "users": {
    "1": ["<attemptId>"]
  }
}
```
