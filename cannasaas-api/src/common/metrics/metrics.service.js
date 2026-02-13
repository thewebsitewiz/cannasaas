"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
// cannasaas-api/src/common/metrics/metrics.service.ts
var common_1 = require("@nestjs/common");
var prom_client_1 = require("prom-client");
var MetricsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MetricsService = _classThis = /** @class */ (function () {
        function MetricsService_1() {
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
        return MetricsService_1;
    }());
    __setFunctionName(_classThis, "MetricsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MetricsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MetricsService = _classThis;
}();
exports.MetricsService = MetricsService;
