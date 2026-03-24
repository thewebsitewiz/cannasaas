import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class TenantService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async resolveBySlug(slug: string) {
    const rows = await this._q(
      `SELECT * FROM dispensaries WHERE slug = $1 AND is_active = true LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
