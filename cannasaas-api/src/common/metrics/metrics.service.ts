// cannasaas-api/src/common/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry = new Registry();

  public readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [this.registry],
  });

  public readonly httpTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  public readonly activeWs = new Gauge({
    name: 'active_websocket_connections',
    help: 'Active WebSocket connections',
    registers: [this.registry],
  });

  public readonly ordersProcessed = new Counter({
    name: 'orders_processed_total',
    help: 'Total orders processed',
    labelNames: ['organization_id', 'status'],
    registers: [this.registry],
  });

  public readonly revenue = new Counter({
    name: 'revenue_cents_total',
    help: 'Total revenue in cents',
    labelNames: ['organization_id'],
    registers: [this.registry],
  });

  public readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query durations',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    registers: [this.registry],
  });
}
