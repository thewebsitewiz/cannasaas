import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StrainData } from './entities/strain-data.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

const CACHE_TTL_HOURS = 168; // 7 days

@Injectable()
export class OtreebaService {
  private strainRepo: any;
  private readonly logger = new Logger(OtreebaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    @Inject(DRIZZLE) private db: any,
    private config: ConfigService
  ) {
    this.baseUrl = this.config.get<string>('OTREEBA_API_BASE_URL') ?? 'https://api.otreeba.com/v1';
    this.apiKey = this.config.get<string>('OTREEBA_API_KEY') ?? '';
  
    this.strainRepo = this._makeRepo('strain_data');
  }

  private get headers(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // ── Single Strain Fetch ───────────────────────────────────────────────────

  async getStrainByOcpc(ocpc: string): Promise<StrainData | null> {
    // Check cache first
    const cached = await this.strainRepo.findOne({ where: { ocpc } });
    if (cached && !this.isStale(cached.last_synced_at)) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/strains/${ocpc}`, { headers: this.headers });
      if (!response.ok) {
        this.logger.warn(`Otreeba strain fetch failed: HTTP ${response.status}`);
        return cached ?? null;
      }

      const data = await response.json();
      return this.upsertStrain(data);
    } catch (err: any) {
      this.logger.error(`Otreeba API error: ${err.message}`);
      return cached ?? null;
    }
  }

  // ── Search Strains by Name ────────────────────────────────────────────────

  async searchStrains(name: string): Promise<StrainData[]> {
    // Check local cache first
    const local = await this.strainRepo.find({
      where: { name: ILike(`%${name}%`) },
      take: 10,
      order: { name: 'ASC' },
    });
    if (local.length > 0) return local;

    // Fetch from Otreeba
    try {
      const response = await fetch(
        `${this.baseUrl}/strains?sort=name&count=10&name=${encodeURIComponent(name)}`,
        { headers: this.headers },
      );
      if (!response.ok) return [];

      const result = await response.json();
      const strains = result.data ?? result ?? [];
      const saved: StrainData[] = [];

      for (const s of strains) {
        saved.push(await this.upsertStrain(s));
      }
      return saved;
    } catch (err: any) {
      this.logger.error(`Otreeba search error: ${err.message}`);
      return [];
    }
  }

  // ── Bulk Import ───────────────────────────────────────────────────────────

  async bulkImportStrains(options?: { page?: number; count?: number; type?: string }): Promise<{ imported: number; skipped: number; total: number }> {
    const page = options?.page ?? 0;
    const count = Math.min(options?.count ?? 50, 50);
    let url = `${this.baseUrl}/strains?page=${page}&count=${count}&sort=-createdAt`;
    if (options?.type) url += `&type=${options.type}`;

    try {
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        this.logger.warn(`Otreeba bulk import failed: HTTP ${response.status}`);
        return { imported: 0, skipped: 0, total: 0 };
      }

      const result = await response.json();
      const strains = result.data ?? result ?? [];
      let imported = 0;
      let skipped = 0;

      for (const s of strains) {
        const existing = await this.strainRepo.findOne({ where: { ocpc: s.ocpc } });
        if (existing && !this.isStale(existing.last_synced_at)) {
          skipped++;
          continue;
        }
        await this.upsertStrain(s);
        imported++;
      }

      this.logger.log(`Otreeba bulk import: ${imported} imported, ${skipped} skipped, ${strains.length} total`);
      return { imported, skipped, total: strains.length };
    } catch (err: any) {
      this.logger.error(`Otreeba bulk import error: ${err.message}`);
      return { imported: 0, skipped: 0, total: 0 };
    }
  }

  // ── Get All Cached Strains ────────────────────────────────────────────────

  async listCachedStrains(type?: string): Promise<StrainData[]> {
    const where: any = {};
    if (type) where.type = type;
    return this.strainRepo.find({ where, order: { name: 'ASC' }, take: 100 });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async upsertStrain(data: any): Promise<StrainData> {
    let strain = await this.strainRepo.findOne({ where: { ocpc: data.ocpc } });

    const fields = {
      ocpc: data.ocpc,
      name: data.name,
      type: data.type ?? data.genetics?.type,
      description: data.description,
      effects: data.effects ?? [],
      flavors: data.flavors ?? [],
      terpenes: data.terpenes ?? [],
      lineage: data.lineage ?? data.genetics?.lineage ?? {},
      genetics: data.genetics?.names ?? data.genetics,
      thc_avg: data.thc_avg ?? data.thc,
      cbd_avg: data.cbd_avg ?? data.cbd,
      photo_url: data.image ?? data.photo_url,
      source: 'otreeba',
      last_synced_at: new Date(),
    };

    if (strain) {
      Object.assign(strain, fields);
    } else {
      strain = this.strainRepo.create(fields);
    }

    return this.strainRepo.save(strain);
  }

  private isStale(lastSyncedAt?: Date | null): boolean {
    if (!lastSyncedAt) return true;
    const hours = (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
    return hours > CACHE_TTL_HOURS;
  }

  private _makeRepo(table: string) {
    const q = this._q.bind(this);
    return {
      async find(opts?: any): Promise<any[]> {
        let s = 'SELECT * FROM ' + table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        if (opts?.order) { const sr = Object.entries(opts.order).map(([k,d]) => k+' '+d); if (sr.length) s += ' ORDER BY ' + sr.join(', '); }
        if (opts?.take) { s += ' LIMIT $'+i++; p.push(opts.take); }
        return q(s, p.length ? p : undefined);
      },
      async findOne(opts?: any): Promise<any> { const rows = await this.find({...opts, take: 1}); return rows[0] ?? null; },
      async findOneOrFail(opts?: any): Promise<any> { const r = await this.findOne(opts); if (!r) throw new Error('Entity not found'); return r; },
      create(data: any): any { return {...data}; },
      async save(entity: any): Promise<any> {
        const cols = Object.keys(entity).filter(k => entity[k] !== undefined);
        const vals = cols.map(k => entity[k]);
        const ph = cols.map((_,i) => '$'+(i+1));
        const [row] = await q('INSERT INTO '+table+' ('+cols.join(',')+') VALUES ('+ph.join(',')+') ON CONFLICT DO NOTHING RETURNING *', vals);
        return row ?? entity;
      },
      async update(criteria: any, values: any): Promise<any> {
        const sets: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(values)) { if (v !== undefined) { sets.push(k+' = $'+i++); p.push(v); } }
        if (!sets.length) return {affected:0};
        const cd: string[] = [];
        if (typeof criteria === 'string' || typeof criteria === 'number') { cd.push('id = $'+i++); p.push(criteria); }
        else { for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); } }
        await q('UPDATE '+table+' SET '+sets.join(',')+' WHERE '+cd.join(' AND '), p);
        return {affected:1};
      },
      async delete(criteria: any): Promise<any> {
        const cd: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); }
        await q('DELETE FROM '+table+(cd.length ? ' WHERE '+cd.join(' AND ') : ''), p);
        return {affected:1};
      },
      async count(opts?: any): Promise<number> {
        let s = 'SELECT COUNT(*)::int as count FROM '+table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        const [r] = await q(s, p.length ? p : undefined); return r?.count ?? 0;
      },
      async remove(entity: any): Promise<void> { const keys = Object.keys(entity); await q('DELETE FROM '+table+' WHERE '+keys[0]+' = $1', [entity[keys[0]]]); },
      createQueryBuilder(alias: string) {
        let s = 'SELECT '+alias+'.* FROM '+table+' '+alias;
        const wheres: string[] = []; const p: any[] = []; let i = 1;
        const obs: string[] = []; let lim: number|undefined;
        return {
          where(cond: string, params?: any) { let c2=cond; if (params) for (const [k,v] of Object.entries(params)) { c2=c2.replace(':'+k,'$'+i++); p.push(v); } wheres.push(c2); return this; },
          andWhere(cond: string, params?: any) { return this.where(cond, params); },
          orderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          addOrderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          take(n: number) { lim=n; return this; },
          async getMany() { let full=s; if (wheres.length) full+=' WHERE '+wheres.join(' AND '); if (obs.length) full+=' ORDER BY '+obs.join(', '); if (lim) { full+=' LIMIT $'+i++; p.push(lim); } return q(full, p.length?p:undefined); },
        };
      },
    };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
