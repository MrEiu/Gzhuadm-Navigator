# Multi-stage production Dockerfile for AuraSense Admissions AI Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build Vite frontend
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["node", "server.mjs"]
