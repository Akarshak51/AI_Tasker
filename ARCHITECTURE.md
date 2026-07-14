# Architecture Document — AI Task Processing Platform

## 1. Overall System Architecture

The platform is split into four independently deployable components:

- **Frontend** — React (Vite) SPA served by an unprivileged nginx container. Talks only to the Backend API over HTTPS/JSON.
- **Backend API** — Node.js/Express. Owns authentication (JWT + bcrypt), task CRUD, and is the only component with write access to MongoDB for user-facing state. It never runs the actual operation logic — it enqueues work and returns immediately.
- **Redis** — a single shared queue (`ai_tasks:queue`) that decouples the API from the worker. The API does `RPUSH`, workers do blocking `BLPOP`. This is intentionally the simplest possible contract (a list of task IDs) rather than a framework-specific job format, so either side can be reimplemented independently.
- **Python Worker** — a stateless consumer. On startup it opens one Redis connection and one MongoDB connection, then loops: pop a task ID, load the task document, mark it `Running`, execute the operation, write back `Success`/`Failed` plus logs. Because it is stateless and idempotent per task ID, it scales horizontally by simply adding replicas.
- **MongoDB** — source of truth for `User` and `Task` documents.

Request flow: browser → Ingress → frontend Service (static assets) or backend Service (`/api/*`) → MongoDB / Redis. The worker is not exposed via Ingress or a Service at all — it only reaches Redis and MongoDB internally, which reduces its attack surface to zero inbound network exposure.

```
[Browser] → [Ingress] → [Frontend:nginx]        [Backend:Express] → [MongoDB]
                              │                        │  │
                              └────── /api ────────────┘  └─ RPUSH ─→ [Redis] ←─ BLPOP ─ [Worker ×N] → [MongoDB]
```

## 2. Worker Scaling Strategy

Workers are a plain Kubernetes `Deployment` (no leader election, no shared local state), so scaling is horizontal and linear: each replica independently blocks on the same Redis list, and Redis guarantees a given list element is delivered to exactly one `BLPOP` caller. Adding replicas increases throughput without any coordination logic.

We scale on **CPU utilization** via an `HorizontalPodAutoscaler` (`k8s/worker-hpa.yaml`), min 3 / max 20 replicas, target 70% CPU. CPU is a reasonable proxy here because the supported operations (uppercase/lowercase/reverse/word-count) are CPU-bound string transforms, not I/O-bound. If future operations become I/O-bound (e.g. calling an external LLM API), the better signal is **queue depth** (`LLEN ai_tasks:queue`) exposed via a custom metrics adapter (Prometheus + KEDA), since CPU will stay low while requests queue up. We call this out explicitly as the next scaling metric to add once real AI-model calls are introduced.

Scale-up is fast (30s stabilization window) so bursts are absorbed quickly; scale-down is slow (120s) to avoid flapping when task volume is bursty.

## 3. Handling High Task Volume (~100,000 tasks/day)

100,000 tasks/day averages to ~1.16 tasks/second, but real traffic is bursty (e.g. business-hours peaks), so the design targets sustained bursts of 20-50 tasks/second:

- **Ingestion is O(1) and non-blocking.** `POST /api/tasks` only does one MongoDB insert and one Redis `RPUSH`; it never waits on the worker. This means API latency stays flat regardless of queue depth.
- **Backend horizontal scaling.** The backend Deployment runs 2+ replicas behind a Service/Ingress; it is stateless (JWT, no server-side sessions) so it scales trivially.
- **Worker horizontal scaling.** As above — this is the primary lever for throughput. At 20 max replicas and sub-100ms processing per simple string operation, the worker tier alone can clear >1000 tasks/second, well above the 1.16/s average.
- **Rate limiting** (`express-rate-limit`) protects the API tier from being overwhelmed by a single abusive client, independent of overall system capacity.
- **Backpressure over data loss.** If Redis or Mongo are briefly saturated, the API returns a 5xx rather than silently dropping a task — task creation and enqueueing happen in the same request, so a failure surfaces to the client instead of losing the job.
- **Queue growth is bounded operationally**, not architecturally: if `LLEN` grows unexpectedly, that's the signal to scale the worker HPA's max, not a hard limit in the code.

## 4. MongoDB Indexing Strategy

Two collections, four indexes total, chosen from the platform's actual read patterns:

| Collection | Index | Reason |
|---|---|---|
| `users` | `{ email: 1 }` unique | Login and registration both look up by email; uniqueness also enforces "no duplicate accounts" at the DB layer instead of only in application code. |
| `tasks` | `{ owner: 1 }` (implicit via `owner: 1, status: 1` compound) | Every dashboard load is `find({ owner })`; this is the hottest query in the system. |
| `tasks` | `{ owner: 1, status: 1 }` compound | Supports the common "show my Pending/Running tasks" filter without a second index, since Mongo can use the compound index's prefix for owner-only queries too. |
| `tasks` | `{ createdAt: -1 }` | Supports recent-first sorting/pagination and would support a future TTL/archival job for tasks older than N days. |

We deliberately did **not** index `inputText` or `result` — they're never filtered or sorted on, and text-indexing large free-text fields would add write overhead for no read benefit at this stage.

## 5. Redis Failure Handling and Recovery

Redis holds only ephemeral queue state (task IDs waiting to be processed) — the durable record of a task and its result always lives in MongoDB. This has two consequences:

- **If Redis is unavailable when a task is created**, the API's `RPUSH` throws; the request returns a 5xx and the task row exists in Mongo as `Pending` but never queued. On Redis recovery, an operator (or a small periodic reconciliation job) can re-scan for `Pending` tasks older than a threshold and re-`RPUSH` them — this is the same code path as the existing "re-run" button, so no new logic is required, only a scheduled trigger.
- **If Redis is unavailable while the worker is running**, `ioredis`/`redis-py`'s built-in reconnect-with-backoff keeps retrying (`retryStrategy` on the Node side, a caught `redis.exceptions.RedisError` + 3s sleep loop on the worker side) rather than crashing the process. Kubernetes' `readinessProbe` for the worker checks that it can open a socket to Redis, so a worker that can't reach Redis is pulled out of "Ready" (useful for observability) without being killed and restarted unnecessarily by `livenessProbe`.
- **Redis itself is deployed as a single Deployment for this assignment's scope.** For a genuinely production-grade deployment we'd run Redis in a managed/HA mode (Sentinel or a managed Redis with replication) so a node failure doesn't stop task ingestion; the queue key name and BLPOP contract are unaffected by that change, so it is purely an infra-layer upgrade.

## 6. Deployment Strategy: Staging vs Production

Both environments run the same container images and Kubernetes manifests (the whole point of GitOps is that "what's in git is what's running") — they differ only in **configuration**, not in code:

| Aspect | Staging | Production |
|---|---|---|
| Namespace | `ai-task-platform-staging` | `ai-task-platform` |
| Argo CD Application | separate `Application` object pointing at the `staging` branch/overlay | points at `main` |
| Replica counts | 1 backend / 1 frontend / 2 workers | 2+ backend / 2+ frontend / HPA 3-20 workers |
| Database | smaller MongoDB instance, seeded with synthetic data | full-size MongoDB with backups enabled |
| Secrets | separate `ai-task-secrets` values (never shared with prod) | production JWT secret, rotated independently |
| Promotion flow | CI pushes every commit on `main` to staging automatically | promotion to production is a deliberate action: bump the image tag in the production overlay (e.g. via a PR) so it's reviewed, then Argo CD's Auto Sync rolls it out |

Kustomize overlays (or a second Argo CD `Application` pointed at a `production/` folder in the infra repo) are the natural next step to express this without duplicating manifests — the base manifests in `k8s/` are the shared source, with per-environment patches for replica counts, resource limits, and the ConfigMap's `CORS_ORIGIN`/host values.
