# CannaSaas — Deployment Guide

**Version:** 2.0 | February 2026

---

## 1. Local Development

### 1.1 Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop
- PostgreSQL 16 (via Docker)
- Redis 7+ (via Docker)

### 1.2 Docker Compose (Local)

```yaml
# docker/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: cannasaas
      POSTGRES_PASSWORD: cannasaas_dev
      POSTGRES_DB: cannasaas_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../scripts/init-postgres.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cannasaas']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@cannasaas.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

### 1.3 Starting Local Dev

```bash
# Terminal 1: Infrastructure
cd docker && docker compose up -d

# Terminal 2: Backend API
cd cannasaas-api
cp .env.example .env    # Edit with local DB credentials
npm run migration:run   # Run TypeORM migrations
npm run seed            # Seed dev data
npm run start:dev       # Starts on port 3000

# Terminal 3: All frontend apps
cd ../                  # Back to monorepo root
turbo dev               # Starts storefront (5173), admin (5174), staff (5175)
```

---

## 2. Environment Configuration

### 2.1 Backend .env

```bash
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cannasaas_dev
DATABASE_USER=cannasaas
DATABASE_PASSWORD=cannasaas_dev
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=false   # ALWAYS false in production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=cannasaas-uploads
AWS_CLOUDFRONT_DOMAIN=cdn.cannasaas.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

---

## 3. AWS Infrastructure

### 3.1 Architecture Overview

```
Region: us-east-1

VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── Application Load Balancer
│   ├── NAT Gateway
│   └── Bastion Host (SSH access)
│
├── Private Subnets - App (10.0.10.0/24, 10.0.11.0/24)
│   └── ECS Fargate Tasks (API + Workers)
│
└── Private Subnets - Data (10.0.20.0/24, 10.0.21.0/24)
    ├── RDS PostgreSQL (Multi-AZ)
    └── ElastiCache Redis (Cluster mode)

External Services:
├── Route 53 (DNS)
├── CloudFront (CDN)
├── S3 (uploads, static assets)
├── OpenSearch (product search)
├── SES (transactional email)
├── Secrets Manager (credentials)
└── KMS (encryption keys)
```

### 3.2 Terraform Modules

```
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── s3/
│   │   ├── cloudfront/
│   │   ├── route53/
│   │   └── secrets/
│   └── environments/
│       ├── staging.tfvars
│       └── production.tfvars
```

### 3.3 Key Terraform Resources

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "cannasaas-${var.environment}"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier     = "cannasaas-${var.environment}"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.environment == "production" ? "db.r6g.large" : "db.t3.medium"
  multi_az       = var.environment == "production"
  
  db_name  = "cannasaas"
  username = "cannasaas_admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
  
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn
  
  backup_retention_period = 30
  deletion_protection     = var.environment == "production"
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "cannasaas-${var.environment}"
  description          = "CannaSaas Redis cluster"
  node_type            = var.environment == "production" ? "cache.r6g.large" : "cache.t3.medium"
  num_cache_clusters   = var.environment == "production" ? 3 : 1
  engine_version       = "7.0"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
```

---

## 4. Docker Images

### 4.1 API Dockerfile (Multi-Stage)

```dockerfile
# docker/Dockerfile.api
FROM node:20-alpine AS builder
WORKDIR /app
COPY cannasaas-api/package*.json ./
RUN npm ci
COPY cannasaas-api/ ./
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

---

## 5. CI/CD Pipelines

### 5.1 CI Pipeline (Pull Requests)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: turbo lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cannasaas_test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: turbo test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/cannasaas_test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: turbo build
```

### 5.2 Deploy Pipeline (Production)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.cannasaas.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-east-1

      - name: Create pre-deploy DB backup
        run: |
          aws rds create-db-snapshot \
            --db-instance-identifier cannasaas-production \
            --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M%S)

      - name: Run database migrations
        run: npm run migrate:up

      - name: Build & push Docker image
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -f docker/Dockerfile.api -t $ECR_REGISTRY/cannasaas-api:${{ github.event.release.tag_name }} .
          docker push $ECR_REGISTRY/cannasaas-api:${{ github.event.release.tag_name }}

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster cannasaas-production \
            --service cannasaas-production-api \
            --force-new-deployment

      - name: Wait for stable deployment
        run: |
          aws ecs wait services-stable \
            --cluster cannasaas-production \
            --services cannasaas-production-api

      - name: Smoke test
        run: curl -f https://api.cannasaas.com/health || exit 1

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} \
            --paths "/*"
```

---

## 6. Database Migrations

```bash
# Generate a new migration
cd cannasaas-api
npm run migration:generate -- src/migrations/AddDeliveryZones

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# CRITICAL: Never use synchronize: true in production
# Always generate and review migrations before running
```

---

## 7. Monitoring & Observability

| Tool | Purpose |
|---|---|
| CloudWatch | Logs, metrics, alarms |
| DataDog / New Relic | APM, distributed tracing |
| Sentry | Error tracking |
| PgHero | PostgreSQL query performance |
| Uptime Robot | External uptime monitoring |

**Key Metrics to Alert On:**
- API response time p95 > 500ms
- Error rate > 1%
- Database connection pool > 80%
- Redis memory > 80%
- ECS task count < desired count
- Disk usage > 85%

---

## 8. Production Checklist

- [ ] `DATABASE_SYNCHRONIZE=false`
- [ ] All secrets in AWS Secrets Manager (not env files)
- [ ] SSL/TLS on all endpoints
- [ ] Rate limiting enabled
- [ ] CORS restricted to known domains
- [ ] RDS Multi-AZ enabled
- [ ] Automated backups (30-day retention)
- [ ] CloudFront caching configured
- [ ] Health check endpoint responding
- [ ] Error tracking (Sentry) connected
- [ ] Log aggregation configured
- [ ] Uptime monitoring active
- [ ] DNS + wildcard SSL certificate provisioned
