# CannaSaas Application Startup Guide

**Local Development Environment Setup**

Version 1.0 | February 2026

---

## Prerequisites

Before starting CannaSaas, make sure the following are installed on your machine:

| Tool.          | Version               | Check Command            | Install                                                  |
| -------------- | --------------------- | ------------------------ | -------------------------------------------------------- |
| Node.js        | 18+ (LTS recommended) | `node -v`                | [nodejs.org](https://nodejs.org)                         |
| npm            | 9+                    | `npm -v`                 | Comes with Node.js                                       |
| Docker Desktop | Latest                | `docker --version`       | [docker.com](https://docker.com/products/docker-desktop) |
| Docker Compose | v2+                   | `docker compose version` | Included with Docker Desktop                             |
| Git            | Latest                | `git --version`          | [git-scm.com](https://git-scm.com)                       |

---

## Project Architecture

CannaSaas is a monorepo with three applications and shared infrastructure:

```
cannasaas/
├── cannasaas-api/           # NestJS backend API         → Port 3000
├── cannasaas-admin/         # React admin dashboard       → Port 5173
├── cannasaas-storefront/    # React customer storefront   → Port 3001
├── scripts/                 # Database init scripts
├── docker-compose.yml       # Infrastructure orchestration
└── .env                     # Root environment variables
```

**Service Dependencies:**

```
┌──────────-───────┐     ┌──────────────────┐     ┌─────────────────────┐
│  cannasaas-admin │────▶│  cannasaas-api   │◀────│ cannasaas-storefront│
│   React (5173)   │     │  NestJS (3000)   │     │    React (3001)     │
└──────────-───────┘     └────────┬─────────┘     └─────────────────────┘
                                  │
                     ┌────────────┼────────────┐
                     ▼                         ▼
             ┌──────────────┐         ┌──────────────┐
             │  PostgreSQL  │         │    Redis     │
             │   (5432)     │         │   (6379)     │
             └──────────────┘         └──────────────┘
```

---

## Step 1: Clone the Repository

```bash
git clone git@github.com:thewebsitewiz/cannasaas.git
cd cannasaas
```

---

## Step 2: Start Infrastructure Services

PostgreSQL and Redis run in Docker containers. Start them first — the API depends on both.

```bash
docker compose up -d postgres redis
```

**Verify they're healthy:**

```bash
docker compose ps
```

You should see both containers with a `healthy` status. If they show `starting`, wait a few seconds and check again.

**What this starts:**

| Service    | Container Name     | Image                  | Port | Purpose                                          |
| ---------- | ------------------ | ---------------------- | ---- | ------------------------------------------------ |
| PostgreSQL | cannasaas-postgres | postgis/postgis:16-3.4 | 5432 | Primary database with PostGIS spatial extensions |
| Redis.     | cannasaas-redis    | redis:7-alpine `       | 6379 | Caching, sessions, feature flag lookups          |

On first run, PostgreSQL automatically executes `scripts/init-postgres.sql` which creates the required extensions (uuid-ossp, postgis, pg_trgm) and all enum types (user_role, order_status, etc.).

**Troubleshooting Docker:**

```bash
# Check container logs if something fails
docker compose logs postgres
docker compose logs redis

# Full reset (destroys data)
docker compose down -v
docker compose up -d postgres redis

# Verify PostgreSQL is accepting connections
docker exec cannasaas-postgres pg_isready -U cannasaas
```

---

## Step 3: Configure Environment Variables

Each application needs its own `.env` file. The `.env.example` files in each directory contain all the variables with safe development defaults.

### 3a. Backend API Environment

```bash
cd cannasaas-api
cp .env.example .env
```

The default `.env.example` ships with working development values. You only need to edit if you're connecting to external services. The critical variables for local dev:

```bash
# These defaults work out of the box with Docker
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database — matches docker-compose.yml
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=cannasaas
DATABASE_PASSWORD=cannasaas_dev_password
DATABASE_NAME=cannasaas
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true

# Redis — matches docker-compose.yml
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT — change these in production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=7d
```

> **Important:** `DATABASE_SYNCHRONIZE=true` auto-syncs your TypeORM entities to the database schema. This is convenient for development but must be `false` in production — use migrations instead.

### 3b. Admin Dashboard Environment

```bash
cd ../cannasaas-admin
cp .env.example .env
```

Minimal config needed — just the API URL:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 3c. Storefront Environment

```bash
cd ../cannasaas-storefront
cp .env.example .env
```

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Environment Variable Quick Reference

Below are all optional variables you can configure later as you build out each sprint. Leave them blank for now — the app will start without them.

| Variable                     | Sprint  | Service            | Purpose                |
| ---------------------------- | ------- | ------------------ | ---------------------- |
| `STRIPE_SECRET_KEY`          | 1-6, 12 | API                | Payment processing     |
| `STRIPE_PUBLISHABLE_KEY`     | 1-6, 12 | API                | Client-side Stripe     |
| `STRIPE_WEBHOOK_SECRET`      | 1-6, 12 | API                | Webhook verification   |
| `STRIPE_STARTER_PRICE_ID`    | 12      | API                | SaaS billing plan      |
| `STRIPE_PRO_PRICE_ID`        | 12      | API                | SaaS billing plan      |
| `STRIPE_ENTERPRISE_PRICE_ID` | 12      | API                | SaaS billing plan      |
| `AWS_ACCESS_KEY_ID`          | 1-6     | API                | S3/R2 file uploads     |
| `AWS_SECRET_ACCESS_KEY`      | 1-6     | API                | S3/R2 file uploads     |
| `AWS_S3_BUCKET`              | 1-6     | API                | Upload bucket name     |
| `AWS_S3_REGION`              | 1-6     | API                | Bucket region          |
| `AWS_S3_ENDPOINT`            | 1-6     | API                | Cloudflare R2 endpoint |
| `SENDGRID_API_KEY`           | 1-6     | API                | Transactional email    |
| `SENDGRID_FROM_EMAIL`        | 1-6     | API                | Sender email address   |
| `TWILIO_ACCOUNT_SID`         | 1-6     | API                | SMS notifications      |
| `TWILIO_AUTH_TOKEN`          | 1-6     | API                | SMS auth               |
| `TWILIO_PHONE_NUMBER`        | 1-6     | API                | SMS sender number      |
| `ANTHROPIC_API_KEY`          | 11      | API                | AI features (Claude)   |
| `SENTRY_DSN`                 | 8       | API + Frontends    | Error tracking         |
| `METRC_BASE_URL`             | 13      | API                | Compliance tracking    |
| `METRC_VENDOR_KEY`           | 13      | API                | METRC vendor auth      |
| `METRC_USER_KEY`             | 13      | API                | METRC user auth        |
| `METRC_LICENSE_NUMBER`       | 13      | API                | State license          |
| `VITE_STRIPE_PUBLIC_KEY`     | 12      | Admin + Storefront | Client Stripe          |
| `VITE_GOOGLE_MAPS_API_KEY`   | 10      | Storefront         | Delivery tracking      |
| `VITE_SENTRY_DSN`            | 8       | Admin + Storefront | Error tracking         |

---

## Step 4: Install Dependencies & Start the Backend

```bash
cd cannasaas-api
npm install
```

**Run database migrations** (if migrations exist):

```bash
npm run migration:run
```

> If you're starting from scratch with `DATABASE_SYNCHRONIZE=true`, TypeORM will auto-create tables on first boot. You can skip this step initially, but you should switch to migrations before production.

**Start the API in development mode:**

```bash
npm run start:dev
```

You should see:

```
[Nest] LOG [Bootstrap] Swagger docs available at /api/docs
[Nest] LOG [Bootstrap] CannaSaas API running on port 3000
```

**Verify the API is running:**

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Swagger API docs (open in browser)
open http://localhost:3000/api/docs
```

---

## Step 5: Start the Admin Dashboard

Open a **new terminal** (keep the API running):

```bash
cd cannasaas-admin
npm install
npm run dev
```

You should see:

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## Step 6: Start the Storefront (Optional)

Open another **new terminal**:

```bash
cd cannasaas-storefront
npm install
npm run dev
```

The storefront runs on **http://localhost:3001**.

---

## Quick Start (All-in-One)

Once you've done the initial setup above, here's the daily startup sequence:

```bash
# Terminal 1: Infrastructure
cd cannasaas
docker compose up -d postgres redis

# Terminal 2: Backend API
cd cannasaas/cannasaas-api
npm run start:dev

# Terminal 3: Admin Dashboard
cd cannasaas/cannasaas-admin
npm run dev

# Terminal 4: Storefront (if needed)
cd cannasaas/cannasaas-storefront
npm run dev
```

Or use a single script:

````bash
#!/bin/bash
# start-dev.sh — run from project root

echo "Starting infrastructure..."
docker compose up -d postgres redis

echo "Waiting for PostgreSQL..."
until docker exec cannasaas-postgres pg_isready -U cannasaas -q; do
  sleep 1
done
echo "PostgreSQL ready."

echo "Waiting for Redis..."
until docker exec cannasaas-redis redis-cli ping | grep -q PONG; do
  sleep 1
done
echo "Redis ready."

echo ""
echo "Infrastructure is up. Start applications in separate terminals:"
echo ""
echo "  API:        cd cannasaas-api && npm run start:dev"
echo "  Admin:      cd cannasaas-admin && npm run dev"
echo "  Storefront: cd cannasaas-storefront && npm run dev"
echo ""
echo "Endpoints:"
echo "  API:        http://localhost:3000/api/v1"
echo "  Swagger:    http://localhost:3000/api/docs"
echo "  Admin:      http://localhost:5173"
echo "  Storefront: http://localhost:3001"`

Save this as `start-dev.sh` in your project root and run:

```bash
chmod +x start-dev.sh
./start-dev.sh
````

---

## Docker Compose (Full Stack)

Alternatively, you can run **everything** in Docker (API + Admin included), which avoids needing separate terminals:

```bash
docker compose up -d
```

This builds and starts all services. The trade-off is that hot-reload is slower through Docker volumes compared to running natively. Most developers prefer running just Postgres + Redis in Docker and the Node apps natively (as described in Steps 4-6).

To stop everything:

```bash
docker compose down        # Stop containers, keep data
docker compose down -v     # Stop and destroy volumes (fresh start)
```

---

## Verifying Your Setup

After all services are running, confirm everything is connected:

| Check           | Command / URL                                            | Expected                |
| --------------- | -------------------------------------------------------- | ----------------------- |
| PostgreSQL      | `docker exec cannasaas-postgres pg_isready -U cannasaas` | "accepting connections" |
| Redis           | `docker exec cannasaas-redis redis-cli ping`             | `PONG`                  |
| API health      | `curl localhost:3000/api/v1/health`                      | `{"status":"ok"}`       |
| Swagger docs    | http://localhost:3000/api/docs                           | Interactive API docs    |
| Admin dashboard | http://localhost:5173                                    | Login page              |
| Storefront      | http://localhost:3001                                    | Store landing page      |

---

## Shutting Down

**Stop the Node apps:** `Ctrl+C` in each terminal.

**Stop infrastructure:**

```bash
docker compose down          # Keeps your database data
docker compose down -v       # Destroys everything (clean slate)
```

---

## Common Issues

### Port already in use

```bash
# Find what's using the port
lsof -i :3000   # API
lsof -i :5173   # Admin
lsof -i :5432   # PostgreSQL

# Kill the process
kill -9 <PID>
```

### PostgreSQL connection refused

The API can't reach Postgres. Check that:

- Docker is running: `docker compose ps`
- The `.env` has `DATABASE_HOST=localhost` (not `postgres` — that hostname only works inside Docker network)
- Port 5432 is not blocked by another Postgres installation

### TypeORM entity errors on startup

If you see schema sync errors, the database may be out of date:

```bash
# Option 1: Let TypeORM recreate (development only)
# Ensure DATABASE_SYNCHRONIZE=true in .env

# Option 2: Run migrations
cd cannasaas-api
npm run migration:run

# Option 3: Nuclear — drop and recreate the database
docker compose down -v
docker compose up -d postgres redis
# Wait for healthy, then restart the API
```

### node_modules issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Redis connection errors

If you see `ECONNREFUSED 127.0.0.1:6379`:

- Check Redis is running: `docker compose ps redis`
- Check `.env` has `REDIS_HOST=localhost`
- The app will still start without Redis, but caching and feature flags won't work

---

## Application URLs

| Service        | URL                            | Notes                                    |
| -------------- | ------------------------------ | ---------------------------------------- |
| **API**        | http://localhost:3000/api/v1   | REST endpoints                           |
| **Swagger**    | http://localhost:3000/api/docs | Interactive API documentation (dev only) |
| **Admin**      | http://localhost:5173          | Organization/dispensary management       |
| **Storefront** | http://localhost:3001          | Customer-facing shop                     |
| **PostgreSQL** | localhost:5432                 | Connect with any SQL client              |
| **Redis**      | localhost:6379                 | Connect with `redis-cli`                 |

---

## What's Next

Once the application is running, here's where to go depending on what sprint you're working on:

- **Sprint 1-6 (Core Platform):** Auth, multi-tenancy, products, cart, orders, payments — see `CannaSaas-Implementation-Guide.md`
- **Sprint 7+ (Launch & Scale):** Feature flags, monitoring, AI, billing, compliance — see `CannaSaas-Implementation-Guide-Sprints-7-Plus.md`

Start by creating your first organization and super admin user through the Swagger docs at `/api/docs`, then log into the admin dashboard to set up a dispensary.
