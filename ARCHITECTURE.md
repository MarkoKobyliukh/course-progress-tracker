# ARCHITECTURE — Course Progress Tracker

Full-stack app to create courses, add lessons, mark lessons complete, and see backend-computed progress.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | **Node.js + Express + TypeScript** |
| ORM | **Prisma v6** (pinned — v7 removes `url` from `schema.prisma`) |
| Database | **PostgreSQL 16** (in Docker) |
| Frontend | **React + Vite + TypeScript** |
| HTTP client | `fetch` (native) |
| Container | **Docker Compose** (backend + database; frontend optional service) |

### Why Prisma v6 (not v7)
Prisma v7 moves the datasource `url` out of `schema.prisma` into a separate config/runtime mechanism. To keep the classic, well-documented `datasource db { url = env("DATABASE_URL") }` shape, we pin `prisma` and `@prisma/client` to `^6`.

---

## Ports (IMPORTANT)

| Service           | Container port | Host port | Reason                                                                                              |
| ----------------- | -------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Frontend (Vite)   | 5173           | **5173**  | Vite default (dev) / 3000 if containerized                                                          |
| Backend (Express) | 4000           | **4000**  | REST API                                                                                            |
| PostgreSQL        | 5432           | **5433**  | Local **PostgreSQL 17 already owns 5432** — Docker PG is mapped to host **5433** to avoid the clash |

- **Inside Docker network:** backend talks to db on `postgres:5432` (container port, service name `postgres`).
- **From host machine** (e.g. Prisma migrate run locally, or a DB GUI): connect on `localhost:5433`.

Two `DATABASE_URL` values exist for this reason:
- **In-container (docker-compose):** `postgresql://postgres:postgres@postgres:5432/courses_db`
- **Host / local Prisma CLI:** `postgresql://postgres:postgres@localhost:5433/courses_db`

---

## Folder Structure

```txt
course-progress-tracker/
├── docker-compose.yml          # backend + postgres (+ optional frontend)
├── .gitignore
├── README.md                   # submission README (run steps, API, AI report)
├── ARCHITECTURE.md             # this file
├── DEVELOPMENT_PLAN.md         # step-by-step build plan
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env                    # DATABASE_URL (git-ignored)
│   ├── .env.example            # template committed to git
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # Course + Lesson models, Cascade delete
│   │   └── migrations/         # generated SQL migrations
│   └── src/
│       ├── index.ts            # Express app bootstrap, CORS, JSON, route mount
│       ├── prisma.ts           # single PrismaClient instance (singleton)
│       ├── routes/
│       │   ├── courses.ts      # /courses CRUD + progress
│       │   └── lessons.ts      # /courses/:courseId/lessons + /lessons/:id
│       ├── lib/
│       │   └── progress.ts     # computeProgress() — backend-only calculation
│       └── middleware/
│           └── errorHandler.ts # central error/validation responses
│
└── frontend/
    ├── Dockerfile              # optional (bonus)
    ├── .dockerignore
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts          # dev server + proxy to backend
    ├── .env                    # VITE_API_URL
    └── src/
        ├── main.tsx
        ├── App.tsx             # top-level state, course list + selected course
        ├── api.ts              # typed fetch wrappers for every endpoint
        ├── types.ts           # Course, Lesson, CourseWithProgress interfaces
        └── components/
            ├── CourseList.tsx      # list + delete course
            ├── CreateCourseForm.tsx
            ├── CourseDetails.tsx   # progress bar + lessons of selected course
            ├── AddLessonForm.tsx
            └── LessonItem.tsx      # checkbox toggle + delete lesson
```

---

## Data Model

### `Course`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `title` | String | **Required** |
| `description` | String? | Optional |
| `createdAt` | DateTime | `@default(now())` |
| `lessons` | Lesson[] | Relation (one → many) |

### `Lesson`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `courseId` | String | FK → Course.id |
| `title` | String | **Required** |
| `isCompleted` | Boolean | `@default(false)` |
| `createdAt` | DateTime | `@default(now())` |

**Relationship:** one Course → many Lessons.
**Cascade delete:** `onDelete: Cascade` on the Lesson→Course relation — deleting a course automatically deletes all its lessons (enforced at the DB level, not in app code).

### `schema.prisma` (reference)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String?
  createdAt   DateTime @default(now())
  lessons     Lesson[]
}

model Lesson {
  id          String   @id @default(cuid())
  title       String
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId    String
}
```

---

## Progress Logic (Backend-Only)

Progress is **always computed on the backend** — the frontend never divides. It only renders the number the API returns.

```txt
progress = round( completedLessons / totalLessons * 100 )
0 / 0  -> 0%   (guard against division by zero)
```

`computeProgress(lessons)` lives in `src/lib/progress.ts` and is applied in the courses route. `GET /courses` and `GET /courses/:id` return each course enriched with `totalLessons`, `completedLessons`, and `progress`.

---

## REST API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/courses` | List all courses (each with progress) |
| `POST` | `/courses` | Create course (`title` required) |
| `GET` | `/courses/:id` | One course + its lessons + progress |
| `DELETE` | `/courses/:id` | Delete course (cascade deletes lessons) |
| `GET` | `/courses/:courseId/lessons` | List lessons of a course |
| `POST` | `/courses/:courseId/lessons` | Add lesson (`title` required, course must exist) |
| `PATCH` | `/lessons/:id` | Toggle `isCompleted` (must be boolean) / edit title |
| `DELETE` | `/lessons/:id` | Delete a single lesson |
| `GET` | `/health` | Health check (used by Docker `depends_on`) |

### Validation rules
- `course.title` required (non-empty string) → `400` otherwise
- `lesson.title` required → `400`
- `isCompleted` must be boolean → `400`
- Lesson must belong to an existing course → `404` if course missing
- Unknown resource id → `404`

### Response shape (example)
```json
{
  "id": "clx123",
  "title": "TypeScript Basics",
  "description": "Intro course",
  "createdAt": "2026-07-29T10:00:00.000Z",
  "totalLessons": 4,
  "completedLessons": 1,
  "progress": 25,
  "lessons": [ /* ... */ ]
}
```

---

## Request Flow

```txt
React (fetch, api.ts)
   → http://localhost:4000/courses
      → Express router (routes/courses.ts)
         → validation
         → Prisma client (prisma.ts)
            → PostgreSQL (Docker, host:5433 / net:5432)
         → computeProgress(lessons)   [backend only]
      ← JSON with progress fields
   ← React renders list + progress bar
```

---

## Docker Compose Topology

```txt
┌─────────────────────────────────────────────┐
│ docker compose                              │
│                                             │
│  frontend (optional)  backend      postgres │
│  :5173/:3000          :4000        :5432    │
│        │                 │            ▲     │
│        └──── API ────────┘            │     │
│                          └── prisma ──┘     │
│                                             │
│  host ports:  frontend→3000  backend→4000   │
│               postgres→5433 (5432 taken)    │
│                                             │
│  volume: pgdata (persists DB across runs)   │
└─────────────────────────────────────────────┘
```

- **Persistence:** named volume `pgdata` mounted at `/var/lib/postgresql/data` so courses/lessons survive `docker compose down` (removed only with `-v`).
- **Startup order:** `backend depends_on postgres` with a healthcheck; backend runs `prisma migrate deploy` on boot before serving.

---

## Environment Variables

**backend/.env.example**
```env
# Local Prisma CLI on host machine (Postgres exposed on host 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/courses_db"
PORT=4000
```

**docker-compose (backend service env)**
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/courses_db
PORT=4000
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:4000
```
