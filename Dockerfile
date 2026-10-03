# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# Install all deps (incl. dev) for local hot-reload via tsx watch
FROM base AS dev
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/server.ts"]

# Production build
FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
