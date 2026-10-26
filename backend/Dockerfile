# Multi-stage Dockerfile for KnowledgeHub Backend (API & Worker)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create upload directory
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

# Default command runs API server, override with "node dist/worker.js" for worker container
CMD ["node", "dist/server.js"]
