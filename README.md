# ClipCraft

![ClipCraft Demo](output.gif)

AI-powered content studio that transforms scripts into ready-to-publish social media assets — animation scenes, Instagram carousels, and preview thumbnails — all generated and rendered server-side.

---

## Overview

ClipCraft takes a raw video script and runs it through a multi-stage AI pipeline to produce:

| Output | Format | Dimensions |
|--------|--------|------------|
| **Animation Scenes** | HTML → PNG | 1920 × 1080 px (16:9) |
| **Instagram Carousel** | HTML → PNG | 1080 × 1350 px (4:5) |
| **Preview Thumbnails** | HTML → PNG | 1080 × 1920 px Instagram · 1080 × 1440 px TikTok |

All outputs are rendered server-side with Playwright/Chromium and delivered as a downloadable ZIP of PNGs.

---

## Tech Stack

### Backend — `api/`
- **[NestJS](https://nestjs.com/)** — modular Node.js framework
- **[BAML](https://docs.boundaryml.com/)** (BoundaryML) `0.219.0` — type-safe LLM function definitions
- **[Prisma](https://www.prisma.io/)** — ORM with PostgreSQL
- **[Playwright](https://playwright.dev/)** — server-side HTML-to-PNG rendering
- **[Sharp](https://sharp.pixelplumbing.com/)** — image post-processing
- **[Archiver](https://github.com/archiverjs/node-archiver)** — ZIP packaging

### Frontend — `frontend/`
- **[Angular 21](https://angular.dev/)** — standalone components, signals, OnPush
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling
- **Nginx** — serves the SPA and proxies API calls

### Infrastructure
- **PostgreSQL 16** — primary database
- **Docker Compose** — orchestrates all four services
- **Adminer** — database management UI

### AI Models (with automatic fallback)
```
Primary:  Claude Opus 4.6    (anthropic)
Fallback: Claude Sonnet 4.5  (anthropic)
Fallback: Gemini 3.1 Pro     (google-ai)
```

---

## Project Structure

```
clipcraft/
├── api/                        # NestJS backend
│   ├── baml_src/               # BAML AI function definitions
│   │   ├── clients.baml        # LLM clients + fallback chain
│   │   ├── project_metadata.baml
│   │   ├── carousel.baml       # Carousel structure prompt
│   │   ├── carousel_html_generator.baml
│   │   ├── animation_structure.baml
│   │   ├── animation_html_generator.baml
│   │   ├── preview_generator.baml
│   │   └── generators.baml
│   ├── prisma/
│   │   └── schema.prisma       # DB schema (Project, Animation, Carousel, Preview)
│   └── src/
│       ├── modules/
│       │   ├── projects/       # CRUD + generation orchestration
│       │   └── content/
│       │       ├── animation/
│       │       ├── carousel/
│       │       └── preview/
│       └── shared/
│           ├── baml/           # BAML client wrapper
│           ├── prisma/         # Prisma service
│           └── rendering/      # Playwright PNG renderer
├── frontend/                   # Angular 21 SPA
│   ├── src/app/
│   │   ├── pages/
│   │   │   ├── home/           # Project list
│   │   │   └── project-detail/ # Generation UI + script editor
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   └── project.service.ts
│   │   └── shared/
│   ├── nginx.conf              # SPA routing + API proxy
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- API keys for at least one AI provider (Anthropic recommended)

### 1. Clone and configure

```bash
git clone https://github.com/SilvioBaratto/clipcraft.git
cd clipcraft
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...          # optional, used as fallback
OPENAI_API_KEY=...          # optional
```

### 2. Start all services

```bash
docker compose up -d --build
```

This starts four containers:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Angular app |
| API | http://localhost:3001 | NestJS REST API |
| API Docs | http://localhost:3001/api/docs | Swagger UI |
| Adminer | http://localhost:8090 | DB management |

### 3. Use the app

1. Open http://localhost:3000
2. Click **New Project** and paste your video script
3. The AI extracts metadata (title, hook, folder name)
4. Select which content to generate: Animations, Carousel, Previews
5. Click **Generate** and watch the pipeline run
6. Preview the output inline, then **Download PNG** to get the ZIP

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/projects` | Create project from script |
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/:id` | Get project by ID |
| `PATCH` | `/projects/:id/script` | Update project script |
| `DELETE` | `/projects/:id` | Delete project |
| `GET` | `/projects/:id/download` | Download ZIP of rendered PNGs |

### Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/projects/:id/generate/carousel` | Generate carousel (step 1) |
| `POST` | `/projects/:id/generate/animations` | Generate animations (step 2) |
| `POST` | `/projects/:id/generate/previews` | Generate previews (step 3) |
| `POST` | `/projects/:id/generate` | Generate all at once |

Full interactive docs at http://localhost:3001/api/docs.

---

## AI Pipeline

Each generation step calls a BAML function which:

1. **Structures** the content (scenes/slides with layout metadata)
2. **Generates HTML** for each scene/slide using the structure as a prompt
3. **Renders** the HTML to PNG server-side via Playwright
4. **Persists** everything to PostgreSQL

The BAML client uses a three-level fallback chain to handle rate limits:

```baml
client<llm> OpusWithFallback {
  provider fallback
  options {
    strategy [CustomOpus46, CustomSonnet45, Gemini]
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Recommended | Claude Opus 4.6 / Sonnet 4.5 |
| `GOOGLE_API_KEY` | Optional | Gemini 3.1 Pro (fallback) |
| `OPENAI_API_KEY` | Optional | GPT-5 models |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API port (default: 3001) |

---

## Database

The schema has four main models:

- **Project** — stores the source script, extracted metadata, and content flags
- **Animation** → **AnimationScene** — scenes with generated HTML
- **Carousel** → **CarouselSlide** — slides with generated HTML
- **Preview** — Instagram and TikTok thumbnail HTML

Run migrations manually (if needed outside Docker):

```bash
cd api
npx prisma migrate deploy
```

---

## Development (without Docker)

```bash
# Start PostgreSQL locally, then:

# API
cd api
cp ../.env.example .env   # update DATABASE_URL to localhost:5432
npm install
npm run baml-generate     # generate BAML TypeScript client
npx prisma migrate dev
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm start                 # runs on http://localhost:4200
```

---

## License

[MIT](LICENSE)
