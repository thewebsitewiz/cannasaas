"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    constructor() {
        this.registry = new prom_client_1.Registry();
        this.httpDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry],
        });
        this.httpTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        this.activeWs = new prom_client_1.Gauge({
            name: 'active_websocket_connections',
            help: 'Active WebSocket connections',
            registers: [this.registry],
        });
        this.ordersProcessed = new prom_client_1.Counter({
            name: 'orders_processed_total',
            help: 'Total orders processed',
            labelNames: ['organization_id', 'status'],
            registers: [this.registry],
        });
        this.revenue = new prom_client_1.Counter({
            name: 'revenue_cents_total',
            help: 'Total revenue in cents',
            labelNames: ['organization_id'],
            registers: [this.registry],
        });
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'db_query_duration_seconds',
            help: 'Database query durations',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
            registers: [this.registry],
        });
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map