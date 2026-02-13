"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let RedisHealthIndicator = class RedisHealthIndicator extends terminus_1.HealthIndicator {
    constructor(cache) {
        super();
        this.cache = cache;
    }
    async isHealthy(key) {
        try {
            await this.cache.set('health_check', 'ok', 10);
            const val = await this.cache.get('health_check');
            if (val === 'ok')
                return this.getStatus(key, true);
            throw new Error('Redis read/write mismatch');
        }
        catch (e) {
            throw new terminus_1.HealthCheckError('Redis failed', this.getStatus(key, false, { message: e.message }));
        }
    }
};
exports.RedisHealthIndicator = RedisHealthIndicator;
exports.RedisHealthIndicator = RedisHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], RedisHealthIndicator);
//# sourceMappingURL=redis.health.js.map