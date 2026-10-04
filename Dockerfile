# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS dev
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/server.ts"]

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd -S appgroup && useradd -S appuser -G appgroup
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
