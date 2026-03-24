import { Injectable, Logger } from '@nestjs/common';

interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(name: string, labels?: Record<string, string>, amount = 1): void {
    const key = this.key(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + amount);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.gauges.set(this.key(name, labels), value);
  }

  observe(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.key(name, labels);
    const arr = this.histograms.get(key) || [];
    arr.push(value);
    if (arr.length > 1000) arr.shift(); // Keep last 1000
    this.histograms.set(key, arr);
  }

  /** Returns Prometheus text exposition format */
  serialize(): string {
    const lines: string[] = [];

    for (const [key, val] of this.counters) {
      lines.push(`# TYPE ${key.split('{')[0]} counter`);
      lines.push(`${key} ${val}`);
    }
    for (const [key, val] of this.gauges) {
      lines.push(`# TYPE ${key.split('{')[0]} gauge`);
      lines.push(`${key} ${val}`);
    }
    for (const [key, vals] of this.histograms) {
      const name = key.split('{')[0];
      lines.push(`# TYPE ${name} summary`);
      const sorted = [...vals].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      lines.push(`${name}_count${key.includes('{') ? key.slice(key.indexOf('{')) : ''} ${count}`);
      lines.push(`${name}_sum${key.includes('{') ? key.slice(key.indexOf('{')) : ''} ${sum}`);
    }

    return lines.join('\n');
  }

  private key(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    return `${name}{${labelStr}}`;
  }
}
