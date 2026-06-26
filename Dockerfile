FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG API_BACKEND_URL="https://v2.edquate.com:8443"
ENV API_BACKEND_URL=$API_BACKEND_URL

ARG NEXT_PUBLIC_API_BASE="/api/v2"
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone /tmp/standalone
RUN if [ -d "/tmp/standalone/app" ]; then cp -a /tmp/standalone/app/. ./; else cp -a /tmp/standalone/. ./; fi && rm -rf /tmp/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3200

ENV PORT=3200
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]