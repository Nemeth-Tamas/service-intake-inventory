# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs -G nodejs

# We NEED these for prisma migrate to work in the runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js

# Standalone build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Persistence setup
RUN mkdir -p /app/prisma/data /app/public/uploads /app/public/archives && \
    chown -R nextjs:nodejs /app/prisma /app/public/uploads /app/public/archives && \
    chmod -R 777 /app/prisma/data /app/public/uploads /app/public/archives && \
    chmod g+s /app/prisma/data /app/public/uploads /app/public/archives

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:///app/prisma/data/dev.db"

CMD ["sh", "-c", "DATABASE_URL=\"file:///app/prisma/data/dev.db\" npx prisma migrate deploy && node server.js"]
