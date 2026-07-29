# Course Progress Tracker

A simple full-stack app for tracking progress through courses. Create courses, add lessons, mark lessons complete/incomplete, and see a progress percentage that is **computed on the backend**.

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Database:** PostgreSQL on host port **5433**

---

## How to Run

### Option A — Docker (recommended, runs everything)

Requires Docker Desktop.

```bash
docker compose up --build
```

This starts three containers: `postgres`, `backend` (runs DB migrations on boot), and `frontend` (nginx). Then open:

- Frontend → http://localhost:3000
- Backend → http://localhost:4000/courses

Stop with `Ctrl+C`, or `docker compose down` (add `-v` to also wipe the database volume).

### Option B — Run locally (DB in Docker, apps on host)

```bash
# 1. Database only
docker compose up -d postgres

# 2. Backend
cd backend
npm install
npx prisma migrate dev      # first time only, creates tables
npm run dev                 # http://localhost:4000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

Optional — browse the database in a GUI:

```bash
cd backend
npx prisma studio           # http://localhost:5555
```

> **Note on the DB port:** Postgres is exposed on host **5433** (not the usual 5432) because a local PostgreSQL 17 install already owns 5432. Inside the Docker network the backend still reaches it at `postgres:5432`.

---

## Technologies Used

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma **v6** (v7 removes the datasource `url` from the schema, so v6 is pinned) |
| Database | PostgreSQL 16 |
| Frontend | React 19, Vite, TypeScript |
| Web server (frontend container) | nginx |
| Container | Docker + Docker Compose |

---

## API Endpoints

Base URL: `http://localhost:4000`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/courses` | List all courses (each with progress) |
| `POST` | `/courses` | Create a course (`title` required) |
| `GET` | `/courses/:id` | One course with its lessons + progress |
| `DELETE` | `/courses/:id` | Delete a course (its lessons cascade-delete) |
| `GET` | `/courses/:courseId/lessons` | List lessons of a course |
| `POST` | `/courses/:courseId/lessons` | Add a lesson (`title` required, course must exist) |
| `PATCH` | `/lessons/:id` | Update a lesson (`isCompleted` boolean and/or `title`) |
| `DELETE` | `/lessons/:id` | Delete a lesson |

**Validation:** `course.title` and `lesson.title` are required (400 otherwise); `isCompleted` must be a boolean (400 otherwise); adding a lesson to a non-existent course returns 404.

**Progress** is calculated on the backend as `round(completedLessons / totalLessons * 100)`, with `0/0 = 0%`. Every course response includes `totalLessons`, `completedLessons`, and `progress`.

Example course response:

```json
{
  "id": "clx123",
  "title": "TypeScript Basics",
  "description": "Intro course",
  "createdAt": "2026-07-29T10:00:00.000Z",
  "totalLessons": 4,
  "completedLessons": 1,
  "progress": 25
}
```

---

## Database

PostgreSQL with two tables managed by Prisma.

**`courses`**

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | primary key |
| `title` | text | required |
| `description` | text | nullable |
| `createdAt` | timestamp | default now() |

**`lessons`**

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | primary key |
| `title` | text | required |
| `isCompleted` | boolean | default false |
| `createdAt` | timestamp | default now() |
| `courseId` | text | FK → `courses.id`, **ON DELETE CASCADE** |

**Relationship:** one course → many lessons. Deleting a course deletes its lessons automatically via the cascade foreign key (enforced at the database level). Data persists in a Docker named volume (`pgdata`).

---

## Docker

`docker-compose.yml` defines three services:

- **postgres** — `postgres:16`, host port `5433 → 5432`, persistent `pgdata` volume, healthcheck via `pg_isready`.
- **backend** — built from `backend/Dockerfile`; runs `prisma migrate deploy` then starts the compiled server; waits for Postgres to be healthy; host port `4000`.
- **frontend** — built from `frontend/Dockerfile` (Vite build → nginx); host port `3000 → 80`.

Everything comes up with one command: `docker compose up --build`.

---

## What Is Completed

- View course list ✅
- Create course ✅
- Delete course (cascade-deletes lessons) ✅
- Add lesson to course ✅
- Mark lesson completed / not completed ✅
- Progress percentage, computed on the backend ✅
- All required REST endpoints + validation ✅
- PostgreSQL with persistent storage ✅
- Docker Compose for database, backend, **and** frontend ✅
- Loading and error states in the UI ✅

## What Is Not Completed

- Editing course/lesson text after creation (explicitly optional in the task).
- Automated tests (manual testing only, given the ~1 hour scope).
- Authentication / multi-user (out of scope for the task).

---

## AI Usage Report

- **AI tool used:** Claude (Claude Code).
- **What I used AI for:** scaffolding the project structure, writing the Express + Prisma backend and the React frontend, designing the Docker setup, and debugging environment issues. I reviewed and tested every stage before committing.
- **2–3 example prompts:**
  - "Create a full-stack Course Progress Tracker: Node + Express + TypeScript + Prisma, React + Vite + TS, PostgreSQL in Docker Compose. Progress must be computed on the backend. Cascade delete lessons when a course is deleted."
  - "Postgres host port must be 5433 because local PG17 owns 5432 — set up the compose file and DATABASE_URLs accordingly."
  - "Dockerize the backend and frontend so `docker compose up --build` runs the whole stack; the backend should migrate on boot."
- **What I changed manually:** stopped local dev servers before running Docker to free ports, verified each stage in the browser and Prisma Studio, and confirmed progress/cascade behavior end-to-end.
- **What was difficult:**
  - **TypeScript 7 vs ts-node:** `npm install typescript` pulled in TypeScript 7 (the new native-compiler preview), which broke `ts-node-dev` with `Cannot read properties of undefined (reading 'fileExists')`. Fixed by pinning TypeScript to 5.x.
  - **Postgres port 5433:** a local PostgreSQL 17 already owned 5432, so the container had to be remapped to host 5433, which meant maintaining two `DATABASE_URL` values — `localhost:5433` for host/Prisma-CLI use and `postgres:5432` for inside the Docker network.
  - **Docker + Prisma migrate:** getting Prisma client generation and `prisma migrate deploy` to run correctly inside the backend container (installing OpenSSL, generating the client at build time, migrating on boot).
