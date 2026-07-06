# ClipCraft

![ClipCraft Demo](output.gif)

AI-powered content studio that turns a raw video script into ready-to-publish **animation scenes**, and helps you plan the whole publishing calendar — all rendered server-side and delivered as PNGs.

---

## Overview

ClipCraft has two halves:

1. **Generation** — paste a script, and a BAML/LLM pipeline structures it into animation scenes, generates the HTML for each, and renders them to PNG with Playwright/Chromium.
2. **Content Planner** — a Notion-style weekly publishing planner (editorial calendar, weekend-prep, current-week tracker, videos, ideas), fully DB-backed and editable.

| Output | Format | Dimensions |
|--------|--------|------------|
| **Animation Scenes** | HTML → PNG | 1920 × 1080 px (16:9) |

Rendered PNGs are streamed back as a downloadable ZIP.

> Earlier versions also produced Instagram carousels, preview thumbnails and TikTok scripts. The app is now focused on **animations only** — those content types were removed.

---

## Tech Stack

### Backend — `api/`
- **[NestJS 11](https://nestjs.com/)** — modular Node.js framework
- **[BAML](https://docs.boundaryml.com/)** (BoundaryML) `0.222.0` — type-safe LLM functions
- **[Prisma 7](https://www.prisma.io/)** — ORM with PostgreSQL (driver adapter `@prisma/adapter-pg`)
- **[Playwright](https://playwright.dev/)** — server-side HTML-to-PNG rendering
- **[Sharp](https://sharp.pixelplumbing.com/)** — image post-processing (circular logo overlay)
- **[Archiver](https://github.com/archiverjs/node-archiver)** — ZIP packaging

### Frontend — `frontend/`
- **[Angular 21](https://angular.dev/)** — standalone components, signals, `OnPush`, zoneless
- **[Tailwind CSS v4](https://tailwindcss.com/)** — token-based design system (`@theme` CSS variables)
- **[lucide-angular](https://lucide.dev/)** — icon set
- **[marked](https://marked.js.org/)** — markdown rendering (via a `MarkdownPipe`)
- **[Vitest](https://vitest.dev/)** — unit tests (`@angular/build:unit-test`)
- **Nginx** — serves the SPA and proxies `/api/`

### Infrastructure
- **PostgreSQL 16**, **Docker Compose** (4 services), **Adminer** (DB UI)

### AI Models (automatic fallback)
```
Primary:  Claude Opus 4.8    (anthropic)
Fallback: Claude Sonnet 4.6  (anthropic)
Also available: Gemini 3.5 Flash (google-ai), GPT-5.5 (openai)
```

---

## Project Structure

```
clipcraft/
├── api/                         # NestJS backend
│   ├── baml_src/                # BAML AI function definitions
│   │   ├── clients.baml         # LLM clients + Opus→Sonnet fallback
│   │   ├── project_metadata.baml
│   │   ├── animation_structure.baml
│   │   ├── animation_html_generator.baml
│   │   └── generators.baml
│   ├── prisma/
│   │   ├── schema.prisma        # Project, Animation, AnimationScene, PlannerEntry, PlannerTask
│   │   └── migrations/
│   ├── scripts/
│   │   ├── seed-planner.mjs      # seed the planner with EXAMPLE data
│   │   └── instagram-insights.mjs# pull IG analytics (reads token from env)
│   └── src/modules/
│       ├── projects/            # CRUD + animation generation orchestration
│       ├── content/animation/   # animation structure + HTML generation
│       └── planner/             # content-planner CRUD (entries + tasks)
├── frontend/                    # Angular 21 SPA (design-system shell)
│   └── src/app/
│       ├── pages/               # home · project-detail · planner · dashboard · settings · login
│       ├── shared/
│       │   ├── layout / sidebar / bottom-tab-bar
│       │   ├── ui/              # drawer, toast, spinner, button, …
│       │   └── pipes/markdown.pipe.ts
│       └── services/            # api · project · planner · auth
├── .github/workflows/           # ci.yml + docker.yml
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- An Anthropic API key (recommended)

### 1. Clone and configure
```bash
git clone https://github.com/SilvioBaratto/clipcraft.git
cd clipcraft
cp .env.example .env       # add ANTHROPIC_API_KEY (+ optional GOOGLE/OPENAI)
```

### 2. Start all services
```bash
docker compose up -d --build
```

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Angular app |
| API | http://localhost:3001 | NestJS REST API |
| API Docs | http://localhost:3001/api/docs | Swagger UI |
| Adminer | http://localhost:8090 | DB management |

### 3. Use the app
1. Open http://localhost:3000.
2. **New Project** → paste your script. The AI extracts title, hook, and folder name.
3. Open the project → **Generate Animations** → watch the pipeline run, preview scenes inline.
4. **Download PNG** to get the ZIP of rendered scenes.
5. **Planner** (sidebar) → manage your weekly publishing calendar.

### (optional) Seed the planner with example data
```bash
cd api
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/clipcraft node scripts/seed-planner.mjs
```
> Keep your **real** plan in a gitignored `scripts/seed-planner.local.mjs` (same shape) so it never lands in the repo.

---

## API Reference

Base URL: `http://localhost:3001/api/v1` · full docs at `/api/docs`.

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/projects` | Create project from script (AI metadata extraction) |
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/:id` | Get project by ID |
| `PATCH` | `/projects/:id/script` | Update the source script |
| `POST` | `/projects/:id/generate/animations` | Generate animation scenes |
| `POST` | `/projects/:id/generate` | Generate all content (animations) |
| `GET` | `/projects/:id/download` | Download ZIP of rendered PNGs |
| `DELETE` | `/projects/:id` | Delete project |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/content/animation/generate` | Generate an animation set |
| `POST` | `/content/animation/generate-with-html` | …plus rendered HTML |

### Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/planner` | Full planner (calendar entries + tasks) |
| `POST` | `/planner/entries` | Upsert a calendar day |
| `PATCH` | `/planner/entries/:id` | Update theme / prepared / published |
| `DELETE` | `/planner/entries/:id` | Delete a day |
| `POST` | `/planner/tasks` | Add a checklist task (WEEKEND_PREP / IDEAS) |
| `PATCH` | `/planner/tasks/:id` | Update label / done / order |
| `DELETE` | `/planner/tasks/:id` | Delete a task |

---

## AI Pipeline

Each generation call runs a BAML function which:

1. **Structures** the script into scenes with layout metadata (`StructureAnimations`).
2. **Generates HTML** for each scene (`GenerateAnimationHTML`).
3. **Renders** the HTML to PNG server-side via Playwright.
4. **Persists** everything to PostgreSQL.

The LLM client uses a fallback chain to survive rate limits:

```baml
client<llm> OpusWithFallback {
  provider fallback
  options { strategy [Opus, Sonnet] }   // Claude Opus 4.8 → Sonnet 4.6
}
```

---

## Database

Prisma models:

- **Project** — source script, extracted metadata, `hasAnimations` flag
- **Animation → AnimationScene** — scenes with generated HTML
- **PlannerEntry** — one editorial-calendar day (`date`, `theme`, `prepared`, `published`)
- **PlannerTask** — planner checklist item (`WEEKEND_PREP` | `IDEAS`)

The Content Planner uses a single source of truth: the calendar, "Videos", current-week tracker, and weekend-prep all read/write the same `PlannerEntry` rows (`prepared` / `published`), so an edit anywhere reflects everywhere.

Apply migrations outside Docker:
```bash
cd api
npx prisma migrate deploy
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Recommended | Claude Opus 4.8 / Sonnet 4.6 |
| `GOOGLE_API_KEY` | Optional | Gemini 3.5 Flash |
| `OPENAI_API_KEY` | Optional | GPT-5.5 |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API port (default: 3001) |

---

## Development (without Docker)

```bash
# API
cd api
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev              # http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps # lucide/vitest peers lag Angular 21
npm start                      # http://localhost:4200
```

---

## CI/CD

GitHub Actions run on every push / PR to `main`:

- **CI** (`.github/workflows/ci.yml`) — API lint · build · test, Frontend build · test (Vitest). The api jobs drop the host lockfile so Linux native bindings (`@boundaryml/baml`, `sharp`) resolve, then `prisma generate`; the frontend installs with `--legacy-peer-deps`.
- **Docker** (`.github/workflows/docker.yml`) — builds both container images (build-only; no registry push).

---

## License

[MIT](LICENSE)
