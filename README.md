# AI Task Processing Platform

A production-shaped MERN + Python-worker application: authenticated users submit text-processing
tasks, they run asynchronously on a Redis-backed queue consumed by a horizontally scalable Python
worker, and results/status/logs stream back to a themeable React dashboard.

- **Frontend**: React (Vite) + Tailwind, JWT auth, 4 selectable themes, top navbar (not sidebar), shared footer
- **Backend**: Node.js + Express, MongoDB (Mongoose), JWT + bcrypt, Helmet, rate limiting
- **Worker**: Python, consumes a Redis list, writes results back to MongoDB
- **Infra**: Docker (multi-stage, non-root), Docker Compose, Kubernetes, Argo CD (GitOps), GitHub Actions CI/CD

---

## 1. Project Layout

```
ai-task-platform/
├── backend/          Express API
├── worker/            Python background worker
├── frontend/          React (Vite) SPA
├── docker-compose.yml Local multi-service dev environment
├── k8s/               Kubernetes manifests (Deployments/Services/Ingress/etc.)
├── argocd/            Argo CD Application manifest
├── .github/workflows  CI/CD pipeline
└── ARCHITECTURE.md     Required architecture document
```

---

## 2. Run Locally WITHOUT Docker (fastest for development)

You need Node.js 20+, Python 3.12+, and running instances of MongoDB and Redis
(easiest: start just those two via Docker — see step 2a — and run the three apps with `npm`/`python` directly).

### 2a. Start only MongoDB + Redis
```bash
docker compose up -d mongo redis
```

### 2b. Backend
```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to any long random string
npm install
npm run dev                # starts on http://localhost:5000
```

### 2c. Worker (run in a second terminal)
```bash
cd worker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export MONGO_URI="mongodb://localhost:27017/ai_task_platform"
export REDIS_HOST=localhost
export REDIS_PORT=6379
python worker.py
```

### 2d. Frontend (run in a third terminal)
```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                 # opens on http://localhost:5173
```

Visit **http://localhost:5173**, register an account (you must check the Terms & Conditions box),
switch themes with the circular button in the top navbar, create a task, and watch its status move
Pending → Running → Success/Failed in real time.

---

## 3. Run Everything With Docker Compose (closest to production topology)

Requires Docker + Docker Compose installed.

```bash
# from the repo root
export JWT_SECRET="a-long-random-string-you-generate"
docker compose up --build
```

This builds and starts: MongoDB, Redis, backend (port 5000), worker, and frontend (port 8080).

- App: **http://localhost:8080**
- API health check: **http://localhost:5000/health**

Scale the worker tier locally:
```bash
docker compose up --build --scale worker=4 -d
```

Stop everything:
```bash
docker compose down          # add -v to also wipe MongoDB/Redis volumes
```

---

## 4. Deploying to Kubernetes (k3s or any cluster)

### 4a. Build & push images to a registry
```bash
export REGISTRY=docker.io/YOUR_DOCKERHUB_USERNAME
docker build -t $REGISTRY/ai-task-backend:v1  ./backend  && docker push $REGISTRY/ai-task-backend:v1
docker build -t $REGISTRY/ai-task-frontend:v1 ./frontend && docker push $REGISTRY/ai-task-frontend:v1
docker build -t $REGISTRY/ai-task-worker:v1   ./worker   && docker push $REGISTRY/ai-task-worker:v1
```

### 4b. Point the manifests at your images
Edit `k8s/backend.yaml`, `k8s/frontend.yaml`, `k8s/worker.yaml` and replace
`REGISTRY/ai-task-*:IMAGE_TAG` with the images you just pushed (the CI/CD pipeline in
section 6 automates this step for you on every push to `main`).

### 4c. Apply manifests
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml       # edit real secret values first!
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/worker-hpa.yaml
kubectl apply -f k8s/ingress.yaml       # requires an ingress-nginx controller installed
```

Check status:
```bash
kubectl -n ai-task-platform get pods,svc,ingress,hpa
```

---

## 5. GitOps With Argo CD

1. Create a **separate Infrastructure Repository** and copy the contents of `k8s/` into it (e.g. under `k8s/` at its root).
2. Install Argo CD on the cluster:
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```
3. Edit `argocd/application.yaml`, set `spec.source.repoURL` to your Infrastructure Repository's URL, then:
   ```bash
   kubectl apply -f argocd/application.yaml
   ```
4. Auto Sync is already enabled in that manifest (`automated.selfHeal: true`, `automated.prune: true`) — any commit to the Infrastructure Repository's `main` branch is reconciled onto the cluster automatically.
5. Open the Argo CD UI (`kubectl -n argocd port-forward svc/argocd-server 8080:443`) and take the dashboard screenshot required for submission.

---

## 6. CI/CD Pipeline

`.github/workflows/ci-cd.yml` runs on every push to `main`:
1. **Lint** backend and frontend
2. **Build & push** Docker images for backend/frontend/worker to Docker Hub, tagged with the short commit SHA and `latest`
3. **Update the Infrastructure Repository** — checks it out, rewrites the image tags in its `k8s/*.yaml`, commits, and pushes; Argo CD's Auto Sync picks up that commit automatically

Required GitHub Actions secrets:
| Secret | Purpose |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account/namespace to push images to |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `INFRA_REPO_TOKEN` | GitHub PAT with push access to the Infrastructure Repository |

---

## 7. Security Notes

- Passwords hashed with bcrypt (10 salt rounds), never stored or logged in plaintext.
- JWT-based auth; tokens expire (`JWT_EXPIRES_IN`, default 7d).
- `helmet` sets standard security headers; CORS restricted to `CORS_ORIGIN`.
- Global API rate limiting (300 req/15min) plus a stricter limiter on `/api/auth/*` (30 req/15min) to blunt credential-stuffing attempts.
- No secrets are hardcoded — all come from `.env` (local) or Kubernetes `Secret`/`ConfigMap` objects (cluster). `k8s/secrets.yaml` ships with placeholder values only.
- All containers run as a non-root user (see each `Dockerfile`).

---

## 8. API Reference (summary)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account (requires `acceptedTerms: true`) |
| POST | `/api/auth/login` | – | Log in, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/tasks` | ✅ | Create + enqueue a task |
| GET | `/api/tasks` | ✅ | List the current user's tasks |
| GET | `/api/tasks/:id` | ✅ | Get one task (status/result/logs) |
| POST | `/api/tasks/:id/rerun` | ✅ | Re-queue a failed/completed task |

Supported `operation` values: `uppercase`, `lowercase`, `reverse_string`, `word_count`.

---

## 9. Assumptions Made

- Roles are `user` (default) and `admin`; the assignment's functional spec didn't require
  role-restricted endpoints, so `requireRole()` middleware exists and is demonstrated but not
  yet attached to a route — it's there as the extension point for admin-only features (e.g.
  viewing all users' tasks).
- The Redis "queue" is a plain list + `BLPOP`, not a job-queue framework (Bull/RQ), to keep the
  Node↔Python contract to a single shared primitive both languages support natively.
- MongoDB and Redis run as single replicas in the provided k8s manifests for assignment scope;
  `ARCHITECTURE.md` section 5 explains the HA upgrade path.
