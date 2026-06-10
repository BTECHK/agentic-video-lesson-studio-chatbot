# Tutor bot — standalone Cloud Run service. Tiny: Node + tsx, no build step.
# Build context is the REPO ROOT so the curated tool data (content/tools) is bundled.
#   docker build -f bot/Dockerfile -t tutor-bot .
FROM node:22-bookworm-slim
WORKDIR /app

# Install bot deps only (cache-friendly).
COPY bot/package.json bot/package-lock.json* ./bot/
RUN cd bot && npm install --omit=dev --no-audit --no-fund && npm install tsx --no-save --no-audit --no-fund

# Bot source + the shared, public-safe tool data (single source of truth).
COPY bot ./bot
COPY content/tools ./content/tools

ENV NODE_ENV=production
ENV PORT=8080
ENV TELEGRAM_MODE=webhook
EXPOSE 8080
WORKDIR /app/bot
CMD ["npx", "tsx", "src/index.ts"]
