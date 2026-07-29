# Course Progress Tracker

Full-stack app to create courses, add lessons, mark lessons complete, and track course progress. Progress is computed on the backend.

> **Status:** work in progress. This README is filled out fully in the final stage. See [ARCHITECTURE.md](./ARCHITECTURE.md) and [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

## Tech Stack

- **Backend:** Node.js + Express + TypeScript, Prisma v6
- **Database:** PostgreSQL 16 (Docker) — host port **5433**
- **Frontend:** React + Vite + TypeScript
- **Container:** Docker Compose

## Run (coming in later stages)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Database: localhost:5433
