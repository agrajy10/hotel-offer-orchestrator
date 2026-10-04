# Hotel Offer Orchestrator

## Requirements coverage

### Covered

- `GET /api/hotels?city=...` — Temporal-orchestrated supplier fetch + de-dupe
- `GET /api/hotels?city=...&minPrice=&maxPrice=` — price filter from Redis
- Mock Supplier APIs: `GET /supplierA/hotels`, `GET /supplierB/hotels`
- De-dupe by hotel name (cheapest price wins; single-supplier hotels kept)
- Parallel supplier calls via Temporal workflow
- Deduped list saved in Redis (ZSET + HASH + cache flag)
- Docker / Docker Compose (Redis, Temporal, worker, API)
- README with local setup and deployment
- Postman collection (happy path, empty city, price filter, validation)

### Not covered

- `/health` endpoint reporting supplier health
- Structured logging & error handling in activities/workflows
- Postman case: simulate one supplier being down

## Overview

Aggregates hotel offers from two mock suppliers, de-duplicates by name (cheapest wins), and supports price-range filtering. Orchestration uses Temporal; results are cached in Redis.

## Local setup (Docker)

### Prerequisites

- Docker
- Docker Compose

### Run

```bash
cd hotel-offer-orchestrator
docker compose up -d --build
```

Starts **Redis + Temporal + worker + API** in one command.

### Watch logs (readiness)

```bash
docker compose logs -f worker api
```

Look for:

| Log | Meaning |
|-----|---------|
| `[worker] READY — polling task queue "hotel-offers"` | Worker is up |
| `[api] READY — open http://localhost:3000` | API is up |
| `[worker] not ready (attempt N)` + retry | Temporal not up yet; worker retries |
| `[worker] CRASHED` / `[api] FAILED to start` | Process failed |

### Verify

```bash
curl -s "http://localhost:3000/api/hotels?city=delhi"
```

### Ports

| Service | Port |
|---------|------|
| API | 3000 |
| Temporal gRPC | 7233 |
| Temporal UI | 8080 |
| Redis | 6380 |

### Stop

```bash
docker compose down
```

---

## Deployment

```bash
docker compose up -d --build
```

| Service | Image | Role |
|---------|--------|------|
| redis | `redis:7-alpine` | Cache |
| temporal | `temporalio/admin-tools` (`start-dev` + SQLite) | Workflow server + UI |
| worker | `hotel-offer-orchestrator:dev` | Temporal worker |
| api | `hotel-offer-orchestrator:dev` | HTTP API |

### Environment (set in compose)

| Variable | Value |
|----------|--------|
| `TEMPORAL_ADDRESS` | `temporal:7233` |
| `REDIS_URL` | `redis://redis:6379` |
| `SUPPLIER_BASE_URL` | `http://api:3000` (worker) |
| `TASK_QUEUE` | `hotel-offers` |
| `PORT` | `3000` |
