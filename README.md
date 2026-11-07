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
