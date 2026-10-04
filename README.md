# Hotel Offer Orchestrator

## Overview

Hotel Offer Orchestrator aggregates hotel offers from two mock suppliers, de-duplicates them by hotel name (cheapest price wins), and supports price-range filtering.

**Flow:**

1. Client calls `GET /api/hotels?city=...`
2. API checks Redis cache for that city
3. **Cache hit** → return offers (optionally filtered by price in Redis)
4. **Cache miss** → Temporal workflow runs:
   - Fetch Supplier A and Supplier B in parallel
   - De-duplicate by name (lower price wins)
   - Save result to Redis
   - Return list
5. If one supplier fails, use the other; if both fail, workflow fails with `ApplicationFailure`

**Stack:** Node.js (TypeScript), Express, Temporal, Redis, PostgreSQL, Docker Compose

| Component | Role |
|-----------|------|
| API | HTTP endpoints; starts workflows; reads Redis |
| Worker | Runs Temporal workflows and activities |
| Temporal | Durable orchestration (history in PostgreSQL) |
| Redis | Cached offers + price index |
| PostgreSQL | Temporal persistence |

---

## Local setup (Docker)

### Prerequisites

- Docker
- Docker Compose

### Run

```bash
cd hotel-offer-orchestrator
docker compose up -d --build
```

### Verify

```bash
curl -s "http://localhost:3000/api/hotels?city=delhi"
```

### Ports

| Service | Port |
|---------|------|
| API | 3000 |
| Temporal UI | 8080 |
| Redis | 6380 |
| PostgreSQL | 5433 |

### Stop

```bash
docker compose down
```

---

## Deployment

### With Docker Compose

```bash
cd hotel-offer-orchestrator
docker compose up -d --build
```

| Service | Image / build | Port |
|---------|----------------|------|
| api | build `dev` | 3000 |
| worker | same image | — |
| redis | `redis:7-alpine` | 6380 |
| postgresql | `postgres:15-alpine` | 5433 |
| temporal | `temporalio/auto-setup` | 7233 |
| temporal-ui | `temporalio/ui` | 8080 |

API starts last (depends on redis, temporal, temporal-ui, worker).

### Production image

```bash
docker build --target runner -t hotel-offer-orchestrator:prod .
```

API:

```bash
docker run -d -p 3000:3000 \
  -e TEMPORAL_ADDRESS=<temporal-host>:7233 \
  -e REDIS_URL=redis://<redis-host>:6379 \
  -e SUPPLIER_BASE_URL=http://<api-host>:3000 \
  -e TASK_QUEUE=hotel-offers \
  hotel-offer-orchestrator:prod
```

Worker (same image):

```bash
docker run -d \
  -e TEMPORAL_ADDRESS=<temporal-host>:7233 \
  -e REDIS_URL=redis://<redis-host>:6379 \
  -e SUPPLIER_BASE_URL=http://<api-host>:3000 \
  -e TASK_QUEUE=hotel-offers \
  hotel-offer-orchestrator:prod \
  node dist/worker.js
```

### Environment variables

| Variable | Compose value | Production |
|----------|----------------|------------|
| `PORT` | `3000` | `3000` |
| `TEMPORAL_ADDRESS` | `temporal:7233` | `<temporal-host>:7233` |
| `TEMPORAL_NAMESPACE` | `default` | `default` |
| `REDIS_URL` | `redis://redis:6379` | `redis://<redis-host>:6379` |
| `SUPPLIER_BASE_URL` | `http://api:3000` | `http://<api-host>:3000` |
| `TASK_QUEUE` | `hotel-offers` | `hotel-offers` |

### Verify deployment

```bash
curl -s "http://<api-host>:3000/api/hotels?city=delhi"
```

Temporal UI: `http://<temporal-ui-host>:8080`

### Stop

```bash
docker compose down
```

Production containers: stop/remove the `docker run` processes manually.
