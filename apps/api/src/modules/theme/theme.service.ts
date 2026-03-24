import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ThemeConfig } from './theme-config.entity';
import { SaveThemeConfigInput } from './dto';
import { CacheService } from '../../common/services/cache.service';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class ThemeService {
  private repo: any;
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly cache: CacheService
  ) {
    this.repo = this._makeRepo('theme_configs');
  }

  /** Get theme config for a dispensary (returns defaults if none saved) */
  async getByDispensaryId(dispensaryId: string): Promise<ThemeConfig> {
    const cacheKey = `theme:${dispensaryId}`;
    const cached = await this.cache.get<ThemeConfig>(cacheKey);
    if (cached) return cached;

    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) {
      await this.cache.set(cacheKey, existing, 300);
      return existing;
    }

    // Return unsaved defaults so the frontend always gets a config
    // Return in-memory defaults (column defaults don't apply on .create())
    const defaults = this.repo.create({
      dispensaryId,
      preset: 'casual',
      primary: '#2d6a4f',
      secondary: '#74956c',
      accent: '#c47820',
      bgPrimary: '#faf6f0',
      bgSecondary: '#f0ebe3',
      bgCard: '#ffffff',
      textPrimary: '#2c2418',
      textSecondary: '#6b5e4f',
      sidebarBg: '#1b3a2a',
      sidebarText: '#c8d8c4',
      success: '#27ae60',
      warning: '#d97706',
      error: '#c0392b',
      info: '#2e86ab',
      isDark: false,
    });
    defaults.id = dispensaryId; // placeholder ID
    return defaults;
  }

  /** Upsert theme config — creates if missing, updates if exists */
  async save(input: SaveThemeConfigInput): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({
      where: { dispensaryId: input.dispensaryId },
    });

    let result: ThemeConfig;
    if (existing) {
      // Merge only provided fields
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          (existing as any)[key] = value;
        }
      });
      result = await this.repo.save(existing);
    } else {
      const config = this.repo.create(input);
      result = await this.repo.save(config);
    }

    // Invalidate cache on save
    await this.cache.del(`theme:${input.dispensaryId}`);
    return result;
  }

  /** Reset to default casual theme */
  async resetToDefault(dispensaryId: string): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) {
      await this.repo.remove(existing);
    }
    // Invalidate cache on reset
    await this.cache.del(`theme:${dispensaryId}`);
    return this.repo.create({ dispensaryId });
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
