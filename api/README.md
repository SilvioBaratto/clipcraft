# ClipCraft API

AI-powered content generation API for TikTok scripts, carousels, and animations using NestJS and BAML.

## Features

- **TikTok Script Generation**: Create engaging TikTok scripts with hooks, sections, and CTAs
- **Carousel Generation**: Generate multi-slide carousels with visual elements
- **Animation Generation**: Create animation sets with scene transitions
- **HTML Export**: Generate HTML representations of carousels and animations
- **Full TypeScript Support**: Type-safe API with proper DTOs and validation
- **Swagger Documentation**: Interactive API documentation at `/api/docs`
- **Health Checks**: Monitor API and service health

## Technology Stack

- **NestJS**: Progressive Node.js framework
- **BAML**: AI function orchestration
- **TypeScript**: Type-safe development
- **Class Validator**: Request validation
- **Swagger/OpenAPI**: API documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- BAML client configured in `baml_client/` directory

### Installation

```bash
# Install dependencies
npm install

# or
yarn install

# or
pnpm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Add your BAML/AI provider configuration here
# OPENAI_API_KEY=your_key_here
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/docs

## API Endpoints

### Health Check
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health information

### Content Generation
- `GET /api/v1/content` - List available endpoints

### TikTok Scripts
- `POST /api/v1/content/tiktok/generate` - Generate TikTok script

### Carousels
- `POST /api/v1/content/carousel/generate` - Generate carousel
- `POST /api/v1/content/carousel/generate-with-html` - Generate carousel with HTML

### Animations
- `POST /api/v1/content/animation/generate` - Generate animation set
- `POST /api/v1/content/animation/generate-with-html` - Generate animation with HTML

## Project Structure

```
api/
├── baml_client/          # Generated BAML client
├── baml_src/             # BAML definitions
├── src/
│   ├── common/           # Shared utilities
│   │   ├── decorators/   # Custom decorators
│   │   ├── filters/      # Exception filters
│   │   └── interceptors/ # HTTP interceptors
│   ├── config/           # Configuration files
│   ├── modules/          # Feature modules
│   │   ├── content/      # Content generation
│   │   │   ├── animation/
│   │   │   ├── carousel/
│   │   │   └── tiktok/
│   │   └── health/       # Health checks
│   ├── shared/           # Shared modules
│   │   └── baml/         # BAML service wrapper
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── test/                 # E2E tests
└── package.json
```

## Development

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## API Examples

### Generate TikTok Script

```bash
curl -X POST http://localhost:3001/api/v1/content/tiktok/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "How to make the perfect espresso at home"}'
```

### Generate Carousel with HTML

```bash
curl -X POST http://localhost:3001/api/v1/content/carousel/generate-with-html \
  -H "Content-Type: application/json" \
  -d '{"topic": "5 tips for better productivity"}'
```

### Generate Animation

```bash
curl -X POST http://localhost:3001/api/v1/content/animation/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "The water cycle explained"}'
```

## VS Code Integration

The project includes VS Code configuration for debugging and tasks. Use F5 to start debugging or run tasks from the Command Palette.

## License

UNLICENSED - Private project
