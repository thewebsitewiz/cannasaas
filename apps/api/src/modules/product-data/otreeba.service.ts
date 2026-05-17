import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { StrainData } from './entities/strain-data.entity';

const CACHE_TTL_HOURS = 168; // 7 days

interface OtreebaGenetics {
  type?: string;
  lineage?: unknown;
  names?: string;
}

interface OtreebaStrainPayload {
  ocpc: string;
  name: string;
  type?: string;
  description?: string;
  effects?: unknown;
  flavors?: unknown;
  terpenes?: unknown;
  lineage?: unknown;
  genetics?: OtreebaGenetics | string;
  thc_avg?: number;
  cbd_avg?: number;
  thc?: number;
  cbd?: number;
  image?: string;
  photo_url?: string;
}

interface OtreebaListResponse {
  data?: OtreebaStrainPayload[];
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function asStrainArray(result: unknown): OtreebaStrainPayload[] {
  if (Array.isArray(result)) return result as OtreebaStrainPayload[];
  if (result && typeof result === 'object' && 'data' in result) {
    const d = (result as OtreebaListResponse).data;
    if (Array.isArray(d)) return d;
  }
  return [];
}

@Injectable()
export class OtreebaService {
  private readonly logger = new Logger(OtreebaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    @InjectRepository(StrainData) private strainRepo: Repository<StrainData>,
    private config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('OTREEBA_API_BASE_URL') ??
      'https://api.otreeba.com/v1';
    this.apiKey = this.config.get<string>('OTREEBA_API_KEY') ?? '';
  }

  private get headers(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // ── Single Strain Fetch ───────────────────────────────────────────────────

  async getStrainByOcpc(ocpc: string): Promise<StrainData | null> {
    const cached = await this.strainRepo.findOne({ where: { ocpc } });
    if (cached && !this.isStale(cached.last_synced_at)) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/strains/${ocpc}`, {
        headers: this.headers,
      });
      if (!response.ok) {
        this.logger.warn(
          `Otreeba strain fetch failed: HTTP ${String(response.status)}`,
        );
        return cached ?? null;
      }

      const data = (await response.json()) as OtreebaStrainPayload;
      return this.upsertStrain(data);
    } catch (err: unknown) {
      this.logger.error(`Otreeba API error: ${errorMessage(err)}`);
      return cached ?? null;
    }
  }

  // ── Search Strains by Name ────────────────────────────────────────────────

  async searchStrains(name: string): Promise<StrainData[]> {
    const local = await this.strainRepo.find({
      where: { name: ILike(`%${name}%`) },
      take: 10,
      order: { name: 'ASC' },
    });
    if (local.length > 0) return local;

    try {
      const response = await fetch(
        `${this.baseUrl}/strains?sort=name&count=10&name=${encodeURIComponent(name)}`,
        { headers: this.headers },
      );
      if (!response.ok) return [];

      const result = (await response.json()) as
        | OtreebaListResponse
        | OtreebaStrainPayload[];
      const strains = asStrainArray(result);
      const saved: StrainData[] = [];

      for (const s of strains) {
        saved.push(await this.upsertStrain(s));
      }
      return saved;
    } catch (err: unknown) {
      this.logger.error(`Otreeba search error: ${errorMessage(err)}`);
      return [];
    }
  }

  // ── Bulk Import ───────────────────────────────────────────────────────────

  async bulkImportStrains(options?: {
    page?: number;
    count?: number;
    type?: string;
  }): Promise<{ imported: number; skipped: number; total: number }> {
    const page = options?.page ?? 0;
    const count = Math.min(options?.count ?? 50, 50);
    let url = `${this.baseUrl}/strains?page=${String(page)}&count=${String(count)}&sort=-createdAt`;
    if (options?.type) url += `&type=${options.type}`;

    try {
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        this.logger.warn(
          `Otreeba bulk import failed: HTTP ${String(response.status)}`,
        );
        return { imported: 0, skipped: 0, total: 0 };
      }

      const result = (await response.json()) as
        | OtreebaListResponse
        | OtreebaStrainPayload[];
      const strains = asStrainArray(result);
      let imported = 0;
      let skipped = 0;

      for (const s of strains) {
        const existing = await this.strainRepo.findOne({
          where: { ocpc: s.ocpc },
        });
        if (existing && !this.isStale(existing.last_synced_at)) {
          skipped++;
          continue;
        }
        await this.upsertStrain(s);
        imported++;
      }

      this.logger.log(
        `Otreeba bulk import: ${String(imported)} imported, ${String(skipped)} skipped, ${String(strains.length)} total`,
      );
      return { imported, skipped, total: strains.length };
    } catch (err: unknown) {
      this.logger.error(`Otreeba bulk import error: ${errorMessage(err)}`);
      return { imported: 0, skipped: 0, total: 0 };
    }
  }

  // ── Get All Cached Strains ────────────────────────────────────────────────

  async listCachedStrains(type?: string): Promise<StrainData[]> {
    const where: FindOptionsWhere<StrainData> = {};
    if (type) where.type = type;
    return this.strainRepo.find({ where, order: { name: 'ASC' }, take: 100 });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async upsertStrain(data: OtreebaStrainPayload): Promise<StrainData> {
    let strain = await this.strainRepo.findOne({ where: { ocpc: data.ocpc } });

    const genetics =
      data.genetics && typeof data.genetics === 'object'
        ? (data.genetics.names ?? undefined)
        : data.genetics;

    const fields = {
      ocpc: data.ocpc,
      name: data.name,
      type:
        data.type ??
        (data.genetics && typeof data.genetics === 'object'
          ? data.genetics.type
          : undefined),
      description: data.description,
      effects: data.effects ?? [],
      flavors: data.flavors ?? [],
      terpenes: data.terpenes ?? [],
      lineage:
        data.lineage ??
        (data.genetics && typeof data.genetics === 'object'
          ? (data.genetics.lineage ?? {})
          : {}),
      genetics,
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
}
