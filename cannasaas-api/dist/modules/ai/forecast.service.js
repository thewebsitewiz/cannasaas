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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let ForecastService = class ForecastService {
    constructor(orderRepo) {
        this.orderRepo = orderRepo;
        this.anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    async forecastDemand(orgId, productId, daysAhead = 30) {
        const salesData = await this.orderRepo.query(`
      SELECT DATE(o.created_at) as date, SUM(oi.quantity) as units_sold
      FROM order_items oi JOIN orders o ON oi.order_id = o.id
      WHERE o.organization_id = $1 AND oi.product_id = $2
        AND o.created_at >= NOW() - INTERVAL '90 days'
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(o.created_at) ORDER BY date ASC
    `, [orgId, productId]);
        const units = salesData.map((d) => parseInt(d.units_sold));
        const avgDaily = units.reduce((s, v) => s + v, 0) / Math.max(units.length, 1);
        const stdDev = Math.sqrt(units.reduce((s, v) => s + (v - avgDaily) ** 2, 0) / Math.max(units.length, 1));
        const prompt = `Analyze sales data and forecast demand:
Daily sales (last 30 days): ${JSON.stringify(salesData.slice(-30))}
Avg daily: ${avgDaily.toFixed(1)}, Std dev: ${stdDev.toFixed(1)}

Forecast ${daysAhead} days. Return JSON only:
{ "predictedDailyAvg": number, "trend": "increasing"|"stable"|"decreasing",
  "recommendedReorderPoint": number, "recommendedSafetyStock": number }`;
        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
        });
        const aiText = response.content[0].type === 'text' ? response.content[0].text : '{}';
        let forecast;
        try {
            forecast = JSON.parse(aiText.replace(/```json?|\n?```/g, '').trim());
        }
        catch {
            forecast = { predictedDailyAvg: avgDaily, trend: 'stable',
                recommendedReorderPoint: Math.ceil(avgDaily * 7),
                recommendedSafetyStock: Math.ceil(stdDev * 2) };
        }
        return {
            productId, historicalAvg: avgDaily, historicalStdDev: stdDev,
            forecast: { ...forecast, forecastDays: daysAhead,
                totalPredicted: Math.ceil(forecast.predictedDailyAvg * daysAhead) },
        };
    }
};
exports.ForecastService = ForecastService;
exports.ForecastService = ForecastService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ForecastService);
//# sourceMappingURL=forecast.service.js.map