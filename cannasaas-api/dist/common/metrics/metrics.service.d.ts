import { Counter, Histogram, Gauge, Registry } from 'prom-client';
export declare class MetricsService {
    readonly registry: Registry<"text/plain; version=0.0.4; charset=utf-8">;
    readonly httpDuration: Histogram<"route" | "method" | "status_code">;
    readonly httpTotal: Counter<"route" | "method" | "status_code">;
    readonly activeWs: Gauge<string>;
    readonly ordersProcessed: Counter<"organization_id" | "status">;
    readonly revenue: Counter<"organization_id">;
    readonly dbQueryDuration: Histogram<"operation" | "table">;
}
