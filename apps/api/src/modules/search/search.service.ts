import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface SearchResult {
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

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private searchClient: any = null;

  constructor(@InjectDataSource() private ds: DataSource) {}

  async onModuleInit() {
    const searchUrl = process.env['OPENSEARCH_NODE'] || process.env['MEILISEARCH_URL'];
    if (searchUrl) {
      try {
        // Dynamic import to avoid hard dependency
        const { MeiliSearch } = await import('meilisearch' as string);
        this.searchClient = new MeiliSearch({
          host: searchUrl,
          apiKey: process.env['MEILISEARCH_API_KEY'] || '',
        });
        this.logger.log(`Search engine connected: ${searchUrl}`);
        await this.ensureIndex();
      } catch {
        this.logger.warn('Search engine not available — falling back to PostgreSQL FTS');
      }
    } else {
      this.logger.log('No search engine configured — using PostgreSQL FTS');
    }
  }

  private async ensureIndex() {
    if (!this.searchClient) return;
    try {
      await this.searchClient.createIndex('products', { primaryKey: 'productId' });
      const index = this.searchClient.index('products');
      await index.updateFilterableAttributes(['strainType', 'dispensaryId', 'effects', 'flavors', 'terpenes', 'thcPercent', 'cbdPercent']);
      await index.updateSearchableAttributes(['name', 'description', 'strainName', 'effects', 'flavors', 'terpenes']);
      await index.updateSortableAttributes(['thcPercent', 'cbdPercent', 'name']);
    } catch { /* index may already exist */ }
  }

  async indexProducts(dispensaryId: string): Promise<number> {
    if (!this.searchClient) return 0;
    const products = await this.ds.query(`
      SELECT p.product_id, p.name, p.description, p.dispensary_id,
             p.strain_type, p.strain_name, p.thc_percent, p.cbd_percent,
             p.effects, p.flavors, p.terpenes, p.lineage
      FROM products p WHERE p.dispensary_id = $1 AND p.deleted_at IS NULL
    `, [dispensaryId]);

    const docs = products.map((p: any) => ({
      productId: p.product_id,
      name: p.name,
      description: p.description,
      dispensaryId: p.dispensary_id,
      strainType: p.strain_type,
      strainName: p.strain_name,
      thcPercent: p.thc_percent ? parseFloat(p.thc_percent) : 0,
      cbdPercent: p.cbd_percent ? parseFloat(p.cbd_percent) : 0,
      effects: Array.isArray(p.effects) ? p.effects : [],
      flavors: Array.isArray(p.flavors) ? p.flavors : [],
      terpenes: Array.isArray(p.terpenes) ? p.terpenes : [],
      lineage: p.lineage,
    }));

    await this.searchClient.index('products').addDocuments(docs);
    return docs.length;
  }

  async search(query: string, dispensaryId: string, filters?: {
    strainType?: string;
    effects?: string[];
    minThc?: number;
    maxThc?: number;
  }, limit = 20): Promise<SearchResult[]> {
    // If search engine available, use it
    if (this.searchClient) {
      const filterParts: string[] = [`dispensaryId = "${dispensaryId}"`];
      if (filters?.strainType) filterParts.push(`strainType = "${filters.strainType}"`);
      if (filters?.minThc) filterParts.push(`thcPercent >= ${filters.minThc}`);
      if (filters?.maxThc) filterParts.push(`thcPercent <= ${filters.maxThc}`);

      const result = await this.searchClient.index('products').search(query, {
        filter: filterParts.join(' AND '),
        limit,
        attributesToRetrieve: ['productId', 'name', 'strainType', 'thcPercent', 'cbdPercent', 'effects', 'flavors', 'terpenes'],
      });
      return result.hits.map((h: any) => ({ ...h, score: h._rankingScore || 1 }));
    }

    // Fallback: PostgreSQL full-text search with synonym support
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
    const params: any[] = [query, dispensaryId];
    let paramIdx = 3;

    if (filters?.strainType) {
      sql += ` AND p.strain_type = $${paramIdx}`;
      params.push(filters.strainType);
      paramIdx++;
    }
    if (filters?.minThc) {
      sql += ` AND p.thc_percent >= $${paramIdx}`;
      params.push(filters.minThc);
      paramIdx++;
    }

    sql += ` ORDER BY score DESC LIMIT $${paramIdx}`;
    params.push(limit);

    const rows = await this.ds.query(sql, params);
    return rows.map((r: any) => ({ ...r, score: parseFloat(r.score) || 0 }));
  }

  /** Natural language search — maps vibes to effects */
  async vibeSearch(vibe: string, dispensaryId: string, limit = 10): Promise<SearchResult[]> {
    const VIBE_MAP: Record<string, string[]> = {
      'relax': ['relaxed', 'calm', 'sleepy'],
      'chill': ['relaxed', 'calm', 'happy'],
      'sleep': ['sleepy', 'relaxed', 'sedated'],
      'energy': ['energetic', 'uplifted', 'focused'],
      'focus': ['focused', 'creative', 'energetic'],
      'creative': ['creative', 'euphoric', 'uplifted'],
      'pain': ['relaxed', 'body-high', 'sleepy'],
      'anxiety': ['calm', 'relaxed', 'happy'],
      'social': ['talkative', 'happy', 'euphoric', 'giggly'],
      'party': ['euphoric', 'energetic', 'happy', 'giggly'],
      'appetite': ['hungry', 'relaxed', 'happy'],
    };

    const vibeKey = Object.keys(VIBE_MAP).find(k => vibe.toLowerCase().includes(k));
    const effects = vibeKey ? VIBE_MAP[vibeKey] : [vibe.toLowerCase()];

    const placeholders = effects.map((_, i) => `$${i + 2}`).join(', ');
    const rows = await this.ds.query(`
      SELECT p.product_id as "productId", p.name, p.strain_type as "strainType",
             p.thc_percent as "thcPercent", p.cbd_percent as "cbdPercent",
             p.effects, p.flavors, p.terpenes,
             (SELECT COUNT(*) FROM jsonb_array_elements_text(p.effects) e WHERE e IN (${placeholders})) as match_count
      FROM products p
      WHERE p.dispensary_id = $1 AND p.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.effects) e WHERE e IN (${placeholders}))
      ORDER BY match_count DESC, p.thc_percent DESC
      LIMIT $${effects.length + 2}
    `, [dispensaryId, ...effects, limit]);

    return rows.map((r: any) => ({ ...r, score: parseInt(r.match_count) || 0 }));
  }
}
