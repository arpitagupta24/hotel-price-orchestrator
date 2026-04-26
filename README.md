# Hotel Offer Orchestrator

Node.js (TypeScript) service that aggregates mocked hotel offers from two suppliers using **Temporal** for orchestration, deduplicates by hotel name, picks the **best price** per name, persists the merged list to **Redis**, and supports **price filtering** via a Lua script executed in Redis.

## Stack

- Express
- Temporal.io (workflow + worker)
- Redis (storage + server-side price filter)
- Docker Compose (Temporal + Postgres + Redis + API + worker)

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop (needed if you want to run dependencies with Compose)

## Run locally (step by step)

### Option A: Full stack with Docker Compose (recommended)

1. Open a terminal and go to project root:

   ```bash
   cd "/Users/arpitagupta/Documents/Tripare"
   ```

2. Start all services (Postgres + Temporal + Redis + API + worker):

   ```bash
   docker compose up --build
   ```

3. Wait until logs show API is listening and Temporal is started.

4. In another terminal, test:

   ```bash
   curl "http://localhost:3001/health"
   curl "http://localhost:3001/api/hotels?city=delhi"
   curl "http://localhost:3001/api/hotels?city=delhi&minPrice=5000&maxPrice=6000"
   ```

5. Stop services:

   ```bash
   # in compose terminal
   Ctrl + C
   # optional cleanup
   docker compose down -v --remove-orphans
   ```

### Option B: Run app + worker locally, only dependencies in Docker

1. Terminal 1: start dependencies only:

   ```bash
   cd "/Users/arpitagupta/Documents/Tripare"
   docker compose up postgresql temporal redis
   ```

2. Terminal 2: install and build:

   ```bash
   cd "/Users/arpitagupta/Documents/Tripare"
   npm ci
   npm run build
   ```

3. Terminal 3: start API:

   ```bash
   cd "/Users/arpitagupta/Documents/Tripare"
   npm run start:api
   ```

4. Terminal 4: start worker:

   ```bash
   cd "/Users/arpitagupta/Documents/Tripare"
   npm run start:worker
   ```

5. Test APIs:

   ```bash
   curl "http://localhost:3001/health"
   curl "http://localhost:3001/api/hotels?city=delhi"
   ```

### Option C: Pure local dev with hot reload (no Docker for app/worker)

Use this when dependencies are already running on localhost (`Temporal: 127.0.0.1:7233`, `Redis: 127.0.0.1:6379`):

```bash
cd "/Users/arpitagupta/Documents/Tripare"
npm ci
npm run dev:api
```

In a second terminal:

```bash
cd "/Users/arpitagupta/Documents/Tripare"
npm run dev:worker
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hotels?city=<city>` | Runs the Temporal workflow: fetches Supplier A and B in parallel, merges by name (cheapest wins), saves JSON to Redis, returns the list. |
| GET | `/api/hotels?city=<city>&minPrice=&maxPrice=` | Reads the deduplicated list from Redis and filters by `price` **inside Redis** (Lua + cjson). If the key is missing, runs the workflow first. |
| GET | `/supplierA/hotels?city=<city>` | Mock supplier A. |
| GET | `/supplierB/hotels?city=<city>` | Mock supplier B. |
| GET | `/health` | Overall status plus Redis, Temporal connectivity, and HTTP checks against both supplier routes. |

Mock data includes overlapping names for `city=delhi` so merges are visible. Unknown cities return an empty array.

Optional query for demos: `simulateDown=1` on a supplier route returns HTTP 503.

### Local environment defaults

- API port: `3001`
- Temporal address: `127.0.0.1:7233`
- Redis host/port: `127.0.0.1:6379`

## Postman

Import `postman/Hotel-Orchestrator.postman_collection.json`. The collection variable `baseUrl` defaults to `http://localhost:3001`.

## Response shape

```json
[
  {
    "name": "Holtin",
    "price": 5340,
    "supplier": "Supplier B",
    "commissionPct": 20
  }
]
```

## Architecture (brief)

1. **Workflow** (`hotelOrchestrationWorkflow`): `Promise.all` of two activities (supplier fetches), deterministic merge by normalized name, then an activity writes the JSON blob to Redis.
2. **Filtered hotels**: Redis `GET` + `EVAL` Lua script filters the stored JSON array by `minPrice` / `maxPrice` without loading the full list into application logic for filtering.

## Submission checklist

- Source code in `src/`
- `Dockerfile` and `docker-compose.yml`
- This `README.md`
- Postman collection under `postman/`
