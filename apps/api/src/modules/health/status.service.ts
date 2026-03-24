import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class StatusService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async getStatus(): Promise<{
    status: 'operational' | 'degraded' | 'outage';
    services: { name: string; status: string; latencyMs: number }[];
    uptime: string;
  }> {
    const services: { name: string; status: string; latencyMs: number }[] = [];

    // Check PostgreSQL
    const dbStart = Date.now();
    try {
      await this.ds.query('SELECT 1');
      services.push({ name: 'Database', status: 'operational', latencyMs: Date.now() - dbStart });
    } catch {
      services.push({ name: 'Database', status: 'outage', latencyMs: -1 });
    }

    // API and GraphQL are operational if this code is running
    services.push({ name: 'API', status: 'operational', latencyMs: 0 });
    services.push({ name: 'GraphQL', status: 'operational', latencyMs: 0 });

    const overall = services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'outage')
        ? 'outage'
        : 'degraded';

    return {
      status: overall,
      services,
      uptime: process.uptime().toFixed(0) + 's',
    };
  }
}
