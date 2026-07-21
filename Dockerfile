# Production-optimized multi-stage Dockerfile for StreetPlayR
# Conforms to Google Cloud Run and Next.js production best practices
# Pinned to Node 20.12.0-alpine for absolute build reproducibility

# --- Phase 1: Install dependencies with npm caching ---
FROM node:20.12.0-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Cache npm packages across builds using BuildKit cache mounts
RUN --mount=type=cache,target=/root/.npm npm ci

# --- Phase 2: Compile application & prune devDependencies ---
FROM node:20.12.0-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy environment variables to satisfy next.config.ts validation during build-time
ENV NEXT_PUBLIC_SUPABASE_URL=https://mockproject.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=mockanonkey
ENV SUPABASE_SERVICE_ROLE_KEY=mockservicerolekey
ENV NODE_ENV=production

# Compile Next.js with compiler cache persistence across builds
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Prune development dependencies to minimize final runner layer size
RUN npm prune --omit=dev

# --- Phase 3: Runtime ---
FROM node:20.12.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Enforce secure container execution under non-root system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy compiled resources and production dependencies with owner mapping
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Invoke next directly via node instead of npm scripts.
# This ensures OS signals (SIGTERM, SIGINT) are intercepted by the node process
# for graceful termination inside Google Cloud Run.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
