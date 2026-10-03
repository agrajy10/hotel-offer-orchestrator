# AGENTS.md — Hotel Offer Orchestrator

## Project

Hotel Offer Orchestrator aggregates overlapping hotel offers from two mock
suppliers, dedupes by hotel name (cheapest price wins), orchestrates the flow
with Temporal.io, stores results in Redis, and supports price-range filtering.

**Location:** `tripane-assignment/hotel-offer-orchestrator/`
**Stack:** Node.js (TypeScript), Express, Temporal, Redis, Docker Compose

## Requirements (in scope)

- `GET /api/hotels?city=delhi` — Temporal-orchestrated supplier fetch + dedupe
- `GET /api/hotels?city=delhi&minPrice=<min>&maxPrice=<max>` — filter inside Redis
- Mock endpoints: `GET /supplierA/hotels`, `GET /supplierB/hotels`
- Deduped list saved in Redis
- Docker Compose deployment
- Postman collection + README

### Out of scope (optional/bonus — do not implement now)

- `/health` reporting supplier health
- Structured logging / advanced error handling in activities & workflows
- Postman scenario for "one supplier down"

## Architecture

```
Client → Express API → Temporal Client → HotelOffersWorkflow
                                              ├─ Activity: fetch Supplier A
                                              ├─ Activity: fetch Supplier B  (Promise.all)
                                              ├─ dedupe by name (min price)
                                              └─ Activity: write Redis
Client → Express API → Redis ZRANGEBYSCORE  (when minPrice/maxPrice provided)
```

### Docker Compose services

| Service | Image / build | Command / role | Port |
|---------|----------------|----------------|------|
| `api` | build `.` | `node dist/server.js` | 3000 |
| `worker` | same image | `node dist/worker.js` | — |
| `redis` | `redis:7-alpine` | cache + price queries | 6379 |
| `temporal` | `temporalio/auto-setup` | Temporal server | 7233 |
| `postgresql` | `postgres:15-alpine` | Temporal DB | 5432 |
| `minio` | `minio/minio` | Temporal visibility | 9000 |
| `temporal-ui` | `temporalio/ui` | debug UI | 8080 |

### Environment variables

| Var | Example | Used by |
|-----|---------|---------|
| `PORT` | `3000` | api |
| `TEMPORAL_ADDRESS` | `temporal:7233` | api, worker |
| `TEMPORAL_NAMESPACE` | `default` | api, worker |
| `REDIS_URL` | `redis://redis:6379` | api, worker (activity) |
| `TASK_QUEUE` | `hotel-offers` | worker, client |

## Project structure

```
hotel-offer-orchestrator/
├── AGENTS.md
├── Dockerfile
├── docker-compose.yml
├── README.md
├── postman/hotel-offer-orchestrator.postman_collection.json
├── tsconfig.json
├── package.json
└── src/
    ├── app.ts                      # Express app factory
    ├── server.ts                   # API entrypoint
    ├── worker.ts                   # Temporal worker entrypoint
    ├── config/env.ts               # typed env loading
    ├── types/hotel.ts              # SupplierHotel, BestOffer, query types
    ├── routes/
    │   ├── hotels.ts               # GET /api/hotels
    │   └── suppliers.ts            # mock supplier endpoints
    ├── middleware/errorHandler.ts
    ├── services/redis.ts           # saveOffers, getOffersByPriceRange
    ├── workflows/hotelOffers.ts    # workflow only (deterministic)
    └── activities/fetchHotels.ts   # supplier HTTP + Redis write
```

## API contract

### Response format (deduped)

```json
[
  { "name": "Holtin", "price": 5340, "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison", "price": 5900, "supplier": "Supplier A", "commissionPct": 13 }
]
```

### Mock supplier shape

```json
[
  {
    "hotelId": "a1",
    "name": "Holtin",
    "price": 6000,
    "city": "delhi",
    "commissionPct": 10
  }
]
```

### Mock data rules

- Overlapping hotel names between A and B for `city=delhi` (e.g. Holtin, Radison)
- Cheaper price wins; if only one supplier has the hotel, keep that offer
- At least one city (e.g. `london`) returns `[]` from both suppliers
- Values hardcoded or lightly randomized — must stay deterministic enough for demo

### Query validation (Zod)

- `city`: required, non-empty string
- `minPrice` / `maxPrice`: optional numbers; if both present, `minPrice <= maxPrice`
- Invalid query → `400` with `{ error, message }`

## Temporal design

### Workflow `hotelOffersWorkflow(city: string): Promise<BestOffer[]>`

1. `Promise.all([fetchFromSupplierA(city), fetchFromSupplierB(city)])`
2. Dedupe by `name` — keep lowest `price` (stable tie-break: first supplier wins)
3. `saveOffersToRedis(city, offers)`
4. Return list (sort by price ascending for stable response)

### Activities (I/O only)

| Activity | Responsibility |
|----------|----------------|
| `fetchFromSupplierA` | HTTP GET mock supplier A for city |
| `fetchFromSupplierB` | HTTP GET mock supplier B for city |
| `saveOffersToRedis` | Write ZSET + HASH keys for city |

- Workflow code must not call Redis or HTTP directly
- Use `proxyActivities` with type-only imports
- Keep workflow file free of Node APIs (bundle-safe)

### Redis schema

| Key | Type | Contents |
|-----|------|----------|
| `hotels:{city}:prices` | ZSET | member = hotel name, score = price |
| `hotels:{city}:details` | HASH | field = hotel name, value = JSON `BestOffer` |

- Save: `ZADD` + `HSET` (pipeline)
- Filter: `ZRANGEBYSCORE hotels:{city}:prices min max` then `HGET` details

## API behavior

| Endpoint | Behavior |
|----------|----------|
| `GET /api/hotels?city=delhi` | Execute Temporal workflow (workflowId e.g. `hotels-{city}`), return result |
| `GET /api/hotels?city=delhi&minPrice=5000&maxPrice=6500` | Ensure Redis data (run workflow if empty), filter via Redis score range |
| `GET /api/hotels?city=london` | Workflow → `[]` |
| `GET /supplierA/hotels?city=...` | Mock JSON for supplier A |
| `GET /supplierB/hotels?city=...` | Mock JSON for supplier B |

Unfiltered path always goes through Temporal (no Redis short-circuit).
Filtered path uses Redis after ensuring data exists for that city.

## TypeScript conventions

- Strict TypeScript; no `any` in application code
- Interfaces for object shapes (`SupplierHotel`, `BestOffer`, etc.)
- Arrow functions for Express handlers; async/await consistently
- kebab-case filenames; PascalCase types
- Zod for runtime validation with inferred types
- Express 5 patterns; centralized error middleware
- Separate workflow files from activity files (Temporal bundling)

## Scripts (package.json)

| Script | Command |
|--------|---------|
| `build` | `tsc -p tsconfig.json` |
| `dev:api` | `tsx watch src/server.ts` |
| `dev:worker` | `tsx watch src/worker.ts` |
| `start:api` | `node dist/server.js` |
| `start:worker` | `node dist/worker.js` |

Dependencies: `express`, `@temporalio/client|worker|workflow|activity`, `ioredis`, `zod`
DevDependencies: `typescript`, `tsx`, `@types/express`, `@types/node`

## Dockerfile

Multi-stage:

1. **deps** — install production deps (`npm ci --omit=dev` after copying package files; for build stage also need devDeps for `tsc`)
2. **build** — copy source, `npm run build`
3. **runner** — non-root user, copy `dist` + production `node_modules`, default `CMD node dist/server.js`

- Worker container overrides command to `node dist/worker.js`
- Same image for api and worker

## Postman collection

File: `postman/hotel-offer-orchestrator.postman_collection.json`

Required requests:

1. Happy path — `GET /api/hotels?city=delhi` (overlaps, cheaper price, supplier field)
2. Empty city — `GET /api/hotels?city=london` → `[]`
3. Price filter — `GET /api/hotels?city=delhi&minPrice=...&maxPrice=...`
4. Mock supplier A — `GET /supplierA/hotels?city=delhi`
5. Mock supplier B — `GET /supplierB/hotels?city=delhi`

## README must include

- Prerequisites (Docker, Docker Compose)
- Setup: `docker compose up --build`
- Service ports (API 3000, Temporal UI 8080)
- Example curl commands for all endpoints
- Postman import instructions
- Brief architecture note (Temporal + Redis)

## Verification checklist

- [ ] `docker compose up --build` starts all services healthy
- [ ] `GET /api/hotels?city=delhi` returns deduped list with cheaper overlapping prices
- [ ] `GET /api/hotels?city=london` returns `[]`
- [ ] `GET /api/hotels?city=delhi&minPrice=...&maxPrice=...` filters correctly
- [ ] Redis contains `hotels:delhi:prices` and `hotels:delhi:details`
- [ ] Temporal workflow shows up in Temporal UI
- [ ] Postman collection imports and requests succeed
- [ ] README steps work from a clean clone

## Conventions & constraints

- Do not implement optional/bonus features until explicitly requested
- Workflow code stays deterministic — no I/O in `workflows/`
- All `@temporalio/*` packages must share the same version
- Prefer editing within this project tree only
- After any opencode config change, remind user to restart opencode
