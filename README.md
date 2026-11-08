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

## Backend structure

- `backend/app/api/routes/` defines the HTTP endpoints.
- `backend/app/schemas/` contains request models.
- `backend/app/services/` contains authentication and attempt-scoring logic.
- `backend/app/repositories/` handles question data and attempt persistence.
- `backend/app/core/` contains shared configuration.

## Demo login accounts

Use any of these DummyJSON demo accounts to sign in to the web app:

| Name | Username | Password |
| --- | --- | --- |
| Emily Johnson | `emilys` | `emilyspass` |
| Michael Williams | `michaelw` | `michaelwpass` |
| Sophia Brown | `sophiab` | `sophiabpass` |
| James Davis | `jamesd` | `jamesdpass` |
| Emma Miller | `emmaj` | `emmajpass` |
| Olivia Wilson | `oliviaw` | `oliviawpass` |
| Alexander Jones | `alexanderj` | `alexanderjpass` |
| Ava Taylor | `avat` | `avatpass` |
| Ethan Martinez | `ethanm` | `ethanmpass` |
| Isabella Anderson | `isabellad` | `isabelladpass` |

These are public test credentials, not real user accounts. DummyJSON currently
provides 208 users; see the [DummyJSON users endpoint](https://dummyjson.com/users?limit=0)
for the full list and the [authentication docs](https://dummyjson.com/docs/auth)
for login details.

## API

- `POST /api/auth/login` — authenticate through DummyJSON, set an HttpOnly session cookie, and return the public user profile.
- `GET /api/auth/me` — return the profile associated with the session cookie.
- `POST /api/auth/logout` — clear the session cookie.
- `GET /api/categories` — list categories and question counts.
- `GET /api/questions?category=...` — list questions without correct answers.
- `POST /api/attempts` — submit and score an attempt. Requires the session cookie.
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

The frontend provides a quiz history page with links to attempt details. Older
attempt records without answer options are enriched from the question bank when
their saved question text and category still match; existing export files are
not modified.

The browser stores both the access and refresh tokens only in HttpOnly cookies;
JavaScript cannot read them. The backend refreshes an expired access token
automatically while the refresh token remains valid. The refresh cookie is
restricted to the refresh endpoint. Local HTTP development sets `Secure=false`
so the cookies work without TLS. Do not use that setting outside local
development; production must use HTTPS with `AUTH_COOKIE_SECURE=true`. Unsafe
requests validate the `Origin` header against `TRUSTED_ORIGINS`, and the cookies
use `SameSite=Lax`.

Docker Compose reads these settings from environment variables. The development
default `AUTH_ACCESS_TOKEN_TTL_MINUTES=1` is intentionally short to exercise
refresh behavior; increase it for normal use. Set `AUTH_COOKIE_SECURE=true` when
serving the app over HTTPS.
