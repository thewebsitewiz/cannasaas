// cannasaas-api/src/modules/ai/forecast.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ForecastService {
  private readonly anthropic: Anthropic;

  constructor(@InjectRepository(Order) private orderRepo: Repository<Order>) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async forecastDemand(orgId: string, productId: string, daysAhead = 30) {
    const salesData = await this.orderRepo.query(`
      SELECT DATE(o.created_at) as date, SUM(oi.quantity) as units_sold
      FROM order_items oi JOIN orders o ON oi.order_id = o.id
      WHERE o.organization_id = $1 AND oi.product_id = $2
        AND o.created_at >= NOW() - INTERVAL '90 days'
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(o.created_at) ORDER BY date ASC
    `, [orgId, productId]);

    const units = salesData.map((d: any) => parseInt(d.units_sold));
    const avgDaily = units.reduce((s: number, v: number) => s + v, 0) / Math.max(units.length, 1);
    const stdDev = Math.sqrt(
      units.reduce((s: number, v: number) => s + (v - avgDaily) ** 2, 0) / Math.max(units.length, 1));

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
    } catch {
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
}
