# P6.1: Frontend container.
# Multi-stage build: install + build, then serve with `next start`.
FROM node:20-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

RUN useradd --create-home --uid 1000 app && chown -R app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1

CMD ["npm", "run", "start"]
