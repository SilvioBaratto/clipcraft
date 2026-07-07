# Stage 1: Build NestJS application
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build).
# Drop the lockfile + use `npm install` (not `npm ci`) so platform-specific
# optional deps (sharp + @boundaryml/baml native bindings) resolve for the
# image's OS/arch. A host-generated lockfile triggers npm's optional-deps bug
# (npm/cli#4828), leaving native bindings missing on a different platform.
RUN rm -f package-lock.json && npm install --no-audit --no-fund

# Copy application source
COPY . .

# Generate BAML client
RUN npx baml-cli generate

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app for production
RUN npm run build

# Stage 2: Production image
FROM node:22-slim AS production

WORKDIR /app

# Install system Chromium and dependencies (used by playwright-core)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Point playwright-core at the system Chromium
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files
COPY package*.json ./

# Install only production dependencies (drop lockfile so sharp's native
# bindings resolve for this image's platform — see builder stage note).
RUN rm -f package-lock.json && npm install --omit=dev --no-audit --no-fund

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/baml_client ./baml_client
COPY --from=builder /app/baml_src ./baml_src
COPY --from=builder /app/preview-templates ./preview-templates
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@boundaryml ./node_modules/@boundaryml

# Create non-root user for security + writable output dir for rendered previews
RUN addgroup --gid 1001 nestjs && \
    adduser --uid 1001 --ingroup nestjs --disabled-password --gecos "" nestjs && \
    mkdir -p /app/output && \
    chown nestjs:nestjs /app && \
    chown -R nestjs:nestjs /app/dist /app/prisma /app/baml_src /app/baml_client /app/preview-templates /app/output 2>/dev/null || true

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/src/main.js"]
