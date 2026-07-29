# DEVELOPMENT PLAN — Course Progress Tracker

Step-by-step build plan, broken into **Stages**. After each Stage I give you a **two-part summary** (Files + Key code) and **every terminal command for you to run yourself** — I wait for your output before moving on.

> **Ports reminder:** Postgres → host **5433** (local PG17 owns 5432). Backend → 4000. Frontend → 5173.
> **Progress is computed on the backend only.**
> **Cascade delete:** deleting a course deletes its lessons (`onDelete: Cascade`).

---

## Stage 0 — Repo & Skeleton

**Goal:** Empty project scaffold + public Git repo initialized.

- Create `course-progress-tracker/` with `backend/`, `frontend/`, root `.gitignore`, `README.md`.
- `git init`, first commit, push to a **public** GitHub repo.

**Commands you run:**
```bash
cd "E:/Second Brain/Projects/StellarsTech internship/course-progress-tracker"
git init
git branch -M main
# after GitHub repo is created:
git remote add origin https://github.com/MarkoKobyliukh/course-progress-tracker.git
```

**Summary you get:** Files touched, `.gitignore` contents.

---

## Stage 1 — Database in Docker

**Goal:** Postgres running in Docker on host port **5433**, verified reachable.

- Write `docker-compose.yml` with the `postgres:16` service, `pgdata` volume, host port `5433:5432`.
- Bring up only the DB first to confirm the port mapping works.

**Commands you run:**
```bash
docker compose up -d postgres
docker compose ps
docker compose logs postgres
```

**Summary you get:** `docker-compose.yml` purpose, port-mapping explanation, how to confirm DB is healthy.

---

## Stage 2 — Backend Bootstrap (Express + TS + Prisma)

**Goal:** Express server compiles and answers `GET /health`. Prisma installed and pinned to **v6**.

- `npm init`, install Express + TS + Prisma v6 toolchain.
- `tsconfig.json`, `src/index.ts` (CORS, JSON, `/health`), `src/prisma.ts` singleton.
- `.env` (host `DATABASE_URL` on 5433) + `.env.example`.

**Commands you run:**
```bash
cd backend
npm init -y
npm install express cors
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
npm install prisma@^6 @prisma/client@^6
npx tsc --init
npm run dev            # expect: server on http://localhost:4000
```
Then in a second terminal:
```bash
curl http://localhost:4000/health
```

**Summary you get:** each new file, the `package.json` scripts, the health route.

---

## Stage 3 — Prisma Schema + Migration

**Goal:** `Course` and `Lesson` tables created in Postgres with **Cascade delete**.

- `prisma/schema.prisma` — models from ARCHITECTURE.md, `onDelete: Cascade`.
- Run first migration against the **host DB (localhost:5433)**.
- Generate the Prisma client.

**Commands you run:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio     # optional: browse empty tables on localhost:5555
```

**Summary you get:** `schema.prisma` explained, the generated migration SQL, cascade FK line.

---

## Stage 4 — Courses API

**Goal:** Full course CRUD with backend-computed progress.

- `src/lib/progress.ts` — `computeProgress()`.
- `src/routes/courses.ts` — `GET /courses`, `POST /courses`, `GET /courses/:id`, `DELETE /courses/:id`.
- `src/middleware/errorHandler.ts` — central 400/404/500.
- Mount routes in `index.ts`.

**Commands you run (smoke test):**
```bash
curl -X POST http://localhost:4000/courses -H "Content-Type: application/json" -d "{\"title\":\"TS Basics\",\"description\":\"Intro\"}"
curl http://localhost:4000/courses
```

**Summary you get:** progress helper, courses router, validation + cascade delete behavior.

---

## Stage 5 — Lessons API

**Goal:** Lesson endpoints + validation that lesson belongs to an existing course.

- `src/routes/lessons.ts` — `GET /courses/:courseId/lessons`, `POST /courses/:courseId/lessons`, `PATCH /lessons/:id`, `DELETE /lessons/:id`.
- Validate `title` required, `isCompleted` boolean, parent course exists.

**Commands you run (smoke test):**
```bash
# replace COURSE_ID with a real id from Stage 4
curl -X POST http://localhost:4000/courses/COURSE_ID/lessons -H "Content-Type: application/json" -d "{\"title\":\"Lesson 1\"}"
curl -X PATCH http://localhost:4000/lessons/LESSON_ID -H "Content-Type: application/json" -d "{\"isCompleted\":true}"
curl http://localhost:4000/courses/COURSE_ID
```

**Summary you get:** lessons router, the boolean/ownership validation, progress recalculation proof.

---

## Stage 6 — Frontend Bootstrap (React + Vite + TS)

**Goal:** Vite app runs, `api.ts` typed wrappers hit the backend, course list renders.

- `npm create vite` (react-ts), install deps.
- `types.ts`, `api.ts`, `.env` (`VITE_API_URL`), Vite proxy.
- `App.tsx` fetches and shows `GET /courses` with loading/error states.

**Commands you run:**
```bash
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm run dev           # expect: http://localhost:5173
```

**Summary you get:** vite config/proxy, `api.ts`, `types.ts`, App state wiring.

---

## Stage 7 — Frontend Features

**Goal:** All required UI features working end-to-end.

- `CreateCourseForm`, `CourseList` (delete), `CourseDetails` (progress bar), `AddLessonForm`, `LessonItem` (checkbox toggle + delete).
- Progress bar reads the **backend** `progress` field.
- Loading + error messages.

**Commands you run:** (both servers running)
```bash
# backend terminal
cd backend && npm run dev
# frontend terminal
cd frontend && npm run dev
```
Then manual click-through in the browser.

**Summary you get:** each component's purpose, the toggle→refetch→progress-update flow.

---

## Stage 8 — Dockerize Backend + Frontend

**Goal:** `docker compose up --build` runs the whole stack; backend migrates on boot.

- `backend/Dockerfile` (+ `.dockerignore`), runs `prisma migrate deploy` then starts.
- `frontend/Dockerfile` (bonus) served on host 3000.
- Extend `docker-compose.yml` with `backend` + `frontend` services, in-container `DATABASE_URL` (`postgres:5432`).

**Commands you run:**
```bash
cd "E:/Second Brain/Projects/StellarsTech internship/course-progress-tracker"
docker compose down
docker compose up --build
```
Verify: frontend `http://localhost:3000`, backend `http://localhost:4000/courses`.

**Summary you get:** both Dockerfiles, the final compose file, boot-migration flow.

---

## Stage 9 — Submission README + Polish

**Goal:** README meets all submission requirements; repo is clean and pushed.

- `README.md`: how to run, technologies, API endpoints, DB description, Docker description, what's done / not done, **AI Usage Report** section.
- Final `git add/commit/push` to the public repo.

**Commands you run:**
```bash
git add .
git commit -m "Course Progress Tracker — full stack app"
git push origin main
```

**Summary you get:** README section checklist against the task requirements.

---

## Stage Checklist (task requirements → stage)

| Requirement | Stage |
|---|---|
| View course list | 4, 7 |
| Create course | 4, 7 |
| Delete course (+cascade lessons) | 3, 4, 7 |
| Add lesson | 5, 7 |
| Mark lesson complete/incomplete | 5, 7 |
| Show progress % (backend) | 4, 7 |
| PostgreSQL | 1, 3 |
| Docker Compose (backend + db) | 1, 8 |
| Frontend in Docker (bonus) | 8 |
| Persistent storage | 1 (pgdata volume) |
| Submission README + AI report | 9 |

---

## Working Rules (per your instructions)

1. **After each Stage** → two-part summary:
   - **Files** — each file created/changed, one line on its purpose.
   - **Key code** — the 2–3 most important chunks, each with a 1–2 sentence explanation.
2. **Terminal commands** — I give you every command (frontend, backend, Docker, Prisma) to run yourself. I **wait for your output** before continuing.
3. **Full files only** in code responses, with file path at the top.
4. I don't move to the next Stage until you confirm the current one works.
