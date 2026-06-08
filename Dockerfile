# Multi-stage build for Azure Container Apps (uses Next.js standalone output).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# npm install (not ci) so platform-specific optional deps resolve correctly on
# the Linux build agent even when the lockfile was generated on Windows.
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
