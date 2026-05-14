import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ── Search engine shape ────────────────────────────────────────────────────

interface SearchEngineDocument {
  productId: string;
  [key: string]: unknown;
}

interface SearchEngineHit {
  productId: string;
  name: string;
  strainType?: string;
  thcPercent?: number;
  cbdPercent?: number;
  effects?: string[];
  flavors?: string[];
  terpenes?: string[];
  _rankingScore?: number;
}

interface SearchEngineSearchResponse {
  hits: SearchEngineHit[];
}

interface SearchEngineIndex {
  addDocuments(docs: SearchEngineDocument[]): Promise<unknown>;
  search(
    query: string,
    options: {
      filter?: string;
      limit?: number;
      attributesToRetrieve?: string[];
    },
  ): Promise<SearchEngineSearchResponse>;
  updateFilterableAttributes(attrs: string[]): Promise<unknown>;
  updateSearchableAttributes(attrs: string[]): Promise<unknown>;
  updateSortableAttributes(attrs: string[]): Promise<unknown>;
}

interface SearchEngineClient {
  createIndex(name: string, opts: { primaryKey: string }): Promise<unknown>;
  index(name: string): SearchEngineIndex;
}

interface MeiliSearchModule {
  MeiliSearch: new (opts: {
    host: string;
    apiKey: string;
  }) => SearchEngineClient;
}

// ── DB row types ──────────────────────────────────────────────────────────

interface ProductIndexRow {
  product_id: string;
  name: string;
  description: string | null;
  dispensary_id: string;
  strain_type: string | null;
  strain_name: string | null;
  thc_percent: string | number | null;
  cbd_percent: string | number | null;
  effects: unknown;
  flavors: unknown;
  terpenes: unknown;
  lineage: unknown;
}

interface FtsRow {
  productId: string;
  name: string;
  strainType: string | null;
  thcPercent: string | number | null;
  cbdPercent: string | number | null;
  effects: unknown;
  flavors: unknown;
  terpenes: unknown;
  score: string | number;
}

interface VibeRow extends Omit<FtsRow, 'score'> {
  match_count: string | number;
}

// ── Public DTO ────────────────────────────────────────────────────────────

export interface SearchResult {
  productId: string;
  name: string;
  strainType?: string;
  thcPercent?: number;
  cbdPercent?: number;
  effects?: string[];
  flavors?: string[];
  terpenes?: string[];
  price?: number;
  score: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toStringArray(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.map((v) => String(v));
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private searchClient: SearchEngineClient | null = null;

  constructor(@InjectDataSource() private ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    const searchUrl =
      process.env['OPENSEARCH_NODE'] ?? process.env['MEILISEARCH_URL'];
    if (searchUrl) {
      try {
        const mod = (await import(
          'meilisearch' as string
        )) as MeiliSearchModule;
        this.searchClient = new mod.MeiliSearch({
          host: searchUrl,
          apiKey: process.env['MEILISEARCH_API_KEY'] ?? '',
        });
        this.logger.log(`Search engine connected: ${searchUrl}`);
        await this.ensureIndex();
      } catch {
        this.logger.warn(
          'Search engine not available — falling back to PostgreSQL FTS',
        );
      }
    } else {
      this.logger.log('No search engine configured — using PostgreSQL FTS');
    }
  }

  private async ensureIndex(): Promise<void> {
    if (!this.searchClient) return;
    try {
      await this.searchClient.createIndex('products', {
        primaryKey: 'productId',
      });
      const index = this.searchClient.index('products');
      await index.updateFilterableAttributes([
        'strainType',
        'dispensaryId',
        'effects',
        'flavors',
        'terpenes',
        'thcPercent',
        'cbdPercent',
      ]);
      await index.updateSearchableAttributes([
        'name',
        'description',
        'strainName',
        'effects',
        'flavors',
        'terpenes',
      ]);
      await index.updateSortableAttributes([
        'thcPercent',
        'cbdPercent',
        'name',
      ]);
    } catch {
      /* index may already exist */
    }
  }

  async indexProducts(dispensaryId: string): Promise<number> {
    if (!this.searchClient) return 0;
    const products = await rawQuery<ProductIndexRow>(
      this.ds,
      `
      SELECT p.product_id, p.name, p.description, p.dispensary_id,
             p.strain_type, p.strain_name, p.thc_percent, p.cbd_percent,
             p.effects, p.flavors, p.terpenes, p.lineage
      FROM products p WHERE p.dispensary_id = $1 AND p.deleted_at IS NULL
    `,
      [dispensaryId],
    );

    const docs: SearchEngineDocument[] = products.map((p) => ({
      productId: p.product_id,
      name: p.name,
      description: p.description,
      dispensaryId: p.dispensary_id,
      strainType: p.strain_type,
      strainName: p.strain_name,
      thcPercent: toNumber(p.thc_percent),
      cbdPercent: toNumber(p.cbd_percent),
      effects: Array.isArray(p.effects) ? p.effects : [],
      flavors: Array.isArray(p.flavors) ? p.flavors : [],
      terpenes: Array.isArray(p.terpenes) ? p.terpenes : [],
      lineage: p.lineage,
    }));

    await this.searchClient.index('products').addDocuments(docs);
    return docs.length;
  }

  async search(
    query: string,
    dispensaryId: string,
    filters?: {
      strainType?: string;
      effects?: string[];
      minThc?: number;
      maxThc?: number;
    },
    limit = 20,
  ): Promise<SearchResult[]> {
    if (this.searchClient) {
      const filterParts: string[] = [`dispensaryId = "${dispensaryId}"`];
      if (filters?.strainType)
        filterParts.push(`strainType = "${filters.strainType}"`);
      if (filters?.minThc)
        filterParts.push(`thcPercent >= ${String(filters.minThc)}`);
      if (filters?.maxThc)
        filterParts.push(`thcPercent <= ${String(filters.maxThc)}`);

      const result = await this.searchClient.index('products').search(query, {
        filter: filterParts.join(' AND '),
        limit,
        attributesToRetrieve: [
          'productId',
          'name',
          'strainType',
          'thcPercent',
          'cbdPercent',
          'effects',
          'flavors',
          'terpenes',
        ],
      });
      return result.hits.map((h) => ({
        productId: h.productId,
        name: h.name,
        strainType: h.strainType,
        thcPercent: h.thcPercent,
        cbdPercent: h.cbdPercent,
        effects: h.effects,
        flavors: h.flavors,
        terpenes: h.terpenes,
        score: h._rankingScore ?? 1,
      }));
    }

    let sql = `
      SELECT p.product_id as "productId", p.name, p.strain_type as "strainType",
             p.thc_percent as "thcPercent", p.cbd_percent as "cbdPercent",
             p.effects, p.flavors, p.terpenes,
             ts_rank(to_tsvector('english', COALESCE(p.name,'') || ' ' || COALESCE(p.description,'') || ' ' || COALESCE(p.strain_name,'')), plainto_tsquery('english', $1)) as score
      FROM products p
      WHERE p.dispensary_id = $2 AND p.deleted_at IS NULL
        AND (to_tsvector('english', COALESCE(p.name,'') || ' ' || COALESCE(p.description,'') || ' ' || COALESCE(p.strain_name,'')) @@ plainto_tsquery('english', $1)
             OR p.name ILIKE '%' || $1 || '%'
             OR $1 = ANY(SELECT jsonb_array_elements_text(p.effects))
             OR $1 = ANY(SELECT jsonb_array_elements_text(p.flavors)))
    `;
    const params: unknown[] = [query, dispensaryId];
    let paramIdx = 3;

    if (filters?.strainType) {
      sql += ` AND p.strain_type = $${String(paramIdx)}`;
      params.push(filters.strainType);
      paramIdx++;
    }
    if (filters?.minThc) {
      sql += ` AND p.thc_percent >= $${String(paramIdx)}`;
      params.push(filters.minThc);
      paramIdx++;
    }

    sql += ` ORDER BY score DESC LIMIT $${String(paramIdx)}`;
    params.push(limit);

    const rows = await rawQuery<FtsRow>(this.ds, sql, params);
    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      strainType: r.strainType ?? undefined,
      thcPercent: r.thcPercent == null ? undefined : toNumber(r.thcPercent),
      cbdPercent: r.cbdPercent == null ? undefined : toNumber(r.cbdPercent),
      effects: toStringArray(r.effects),
      flavors: toStringArray(r.flavors),
      terpenes: toStringArray(r.terpenes),
      score: toNumber(r.score),
    }));
  }

  /** Natural language search — maps vibes to effects */
  async vibeSearch(
    vibe: string,
    dispensaryId: string,
    limit = 10,
  ): Promise<SearchResult[]> {
    const VIBE_MAP: Record<string, string[]> = {
      relax: ['relaxed', 'calm', 'sleepy'],
      chill: ['relaxed', 'calm', 'happy'],
      sleep: ['sleepy', 'relaxed', 'sedated'],
      energy: ['energetic', 'uplifted', 'focused'],
      focus: ['focused', 'creative', 'energetic'],
      creative: ['creative', 'euphoric', 'uplifted'],
      pain: ['relaxed', 'body-high', 'sleepy'],
      anxiety: ['calm', 'relaxed', 'happy'],
      social: ['talkative', 'happy', 'euphoric', 'giggly'],
      party: ['euphoric', 'energetic', 'happy', 'giggly'],
      appetite: ['hungry', 'relaxed', 'happy'],
    };

    const vibeKey = Object.keys(VIBE_MAP).find((k) =>
      vibe.toLowerCase().includes(k),
    );
    const effects = vibeKey ? VIBE_MAP[vibeKey] : [vibe.toLowerCase()];

    const placeholders = effects.map((_, i) => `$${String(i + 2)}`).join(', ');
    const rows = await rawQuery<VibeRow>(
      this.ds,
      `
      SELECT p.product_id as "productId", p.name, p.strain_type as "strainType",
             p.thc_percent as "thcPercent", p.cbd_percent as "cbdPercent",
             p.effects, p.flavors, p.terpenes,
             (SELECT COUNT(*) FROM jsonb_array_elements_text(p.effects) e WHERE e IN (${placeholders})) as match_count
      FROM products p
      WHERE p.dispensary_id = $1 AND p.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.effects) e WHERE e IN (${placeholders}))
      ORDER BY match_count DESC, p.thc_percent DESC
      LIMIT $${String(effects.length + 2)}
    `,
      [dispensaryId, ...effects, limit],
    );

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      strainType: r.strainType ?? undefined,
      thcPercent: r.thcPercent == null ? undefined : toNumber(r.thcPercent),
      cbdPercent: r.cbdPercent == null ? undefined : toNumber(r.cbdPercent),
      effects: toStringArray(r.effects),
      flavors: toStringArray(r.flavors),
      terpenes: toStringArray(r.terpenes),
      score: toInt(r.match_count),
    }));
  }
}
