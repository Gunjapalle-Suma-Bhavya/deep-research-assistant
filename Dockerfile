# ==============================================================================
# Multi-Stage Dockerfile for Deep Research Assistant
# Suitable for Render, Railway, Fly.io, or standard container runtimes
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React Vite Single Page Application (SPA)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies with caching
COPY frontend/package*.json ./
RUN npm ci --prefer-offline || npm install

# Build static assets into /app/frontend/dist
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Runtime with FastAPI & Uvicorn
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner
WORKDIR /app

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    PYTHONPATH=/app/src:/app

# Install minimal OS packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application backend, core logic, and data
COPY src/ ./src/
COPY backend/ ./backend/
COPY data/ ./data/

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default port
EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Uvicorn bound to dynamic cloud PORT (Render sets $PORT automatically)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
