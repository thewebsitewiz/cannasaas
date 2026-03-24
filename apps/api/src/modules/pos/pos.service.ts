import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosIntegration } from './entities/pos-integration.entity';
import { PosProductMapping } from './entities/pos-product-mapping.entity';
import { PosSyncLog } from './entities/pos-sync-log.entity';
import { PosProvider, PosCredentials } from './interfaces/pos-provider.interface';
import { DutchieAdapter } from './adapters/dutchie.adapter';
import { TreezAdapter } from './adapters/treez.adapter';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    @Inject(DRIZZLE) private db: any
  ) {}

  // ── Adapter Factory ───────────────────────────────────────────────────────

  private createAdapter(provider: string, credentials: Record<string, any>): PosProvider {
    let adapter: PosProvider;
    switch (provider) {
      case 'dutchie':
        adapter = new DutchieAdapter();
        break;
      case 'treez':
        adapter = new TreezAdapter();
        break;
      default:
        throw new BadRequestException(`Unsupported POS provider: ${provider}`);
    }
    adapter.initialize(credentials as PosCredentials);
    return adapter;
  }

  private async getAdapterForDispensary(dispensaryId: string): Promise<{ adapter: PosProvider; integration: PosIntegration }> {
    const integration = await this.integrationRepo.findOne({
      where: { dispensary_id: dispensaryId, is_active: true },
    });
    if (!integration) throw new NotFoundException('No active POS integration for this dispensary');
    const adapter = this.createAdapter(integration.provider, integration.credentials);
    return { adapter, integration };
  }

  // ── Integration CRUD ──────────────────────────────────────────────────────

  async getIntegration(dispensaryId: string): Promise<PosIntegration | null> {
    return this.integrationRepo.findOne({ where: { dispensary_id: dispensaryId } });
  }

  async upsertIntegration(input: {
    dispensaryId: string;
    provider: string;
    credentials: Record<string, any>;
    dispensaryExternalId?: string;
  }): Promise<PosIntegration> {
    let integration = await this.integrationRepo.findOne({ where: { dispensary_id: input.dispensaryId } });

    if (integration) {
      integration.provider = input.provider;
      integration.credentials = input.credentials;
      integration.dispensary_external_id = input.dispensaryExternalId;
    } else {
      integration = this.integrationRepo.create({
        dispensary_id: input.dispensaryId,
        provider: input.provider,
        credentials: input.credentials,
        dispensary_external_id: input.dispensaryExternalId,
      });
    }

    return this.integrationRepo.save(integration);
  }

  async testConnection(dispensaryId: string): Promise<{ success: boolean; message: string }> {
    const { adapter } = await this.getAdapterForDispensary(dispensaryId);
    const success = await adapter.testConnection();
    const message = success ? 'Connection successful' : 'Connection failed';

    await this.integrationRepo.update(
      { dispensary_id: dispensaryId },
      { is_active: success, last_sync_status: success ? 'connected' : 'connection_failed' },
    );

    return { success, message };
  }

  async activateSync(dispensaryId: string, enabled: boolean): Promise<PosIntegration> {
    await this.integrationRepo.update({ dispensary_id: dispensaryId }, { is_sync_enabled: enabled });
    return this.integrationRepo.findOneOrFail({ where: { dispensary_id: dispensaryId } });
  }

  // ── Product Sync (POS → CannaSaas) ────────────────────────────────────────

  async syncProducts(dispensaryId: string): Promise<PosSyncLog> {
    const startTime = Date.now();
    const { adapter, integration } = await this.getAdapterForDispensary(dispensaryId);

    const syncLog = this.syncLogRepo.create({
      dispensary_id: dispensaryId,
      provider: integration.provider,
      sync_type: 'product_pull',
      status: 'running',
    });
    await this.syncLogRepo.save(syncLog);

    try {
      const posProducts = await adapter.fetchProducts();
      let created = 0, updated = 0, failed = 0;

      for (const posProduct of posProducts) {
        try {
          // Check existing mapping
          let mapping = await this.mappingRepo.findOne({
            where: { dispensary_id: dispensaryId, external_product_id: posProduct.externalId, provider: integration.provider },
          });

          if (mapping) {
            // Update existing product
            await this.updateProductFromPos(mapping.internal_product_id, dispensaryId, posProduct);
            mapping.last_synced_at = new Date();
            await this.mappingRepo.save(mapping);
            updated++;
          } else {
            // Try auto-match by SKU or name
            const matchedProductId = await this.autoMatchProduct(dispensaryId, posProduct);

            if (matchedProductId) {
              mapping = this.mappingRepo.create({
                dispensary_id: dispensaryId,
                internal_product_id: matchedProductId,
                external_product_id: posProduct.externalId,
                provider: integration.provider,
                match_method: 'auto',
                is_confirmed: false,
                last_synced_at: new Date(),
              });
              await this.mappingRepo.save(mapping);
              updated++;
            } else {
              // Create new product from POS data
              const newProductId = await this.createProductFromPos(dispensaryId, posProduct);
              mapping = this.mappingRepo.create({
                dispensary_id: dispensaryId,
                internal_product_id: newProductId,
                external_product_id: posProduct.externalId,
                provider: integration.provider,
                match_method: 'created',
                is_confirmed: true,
                last_synced_at: new Date(),
              });
              await this.mappingRepo.save(mapping);
              created++;
            }

            // Map variants
            for (const variant of posProduct.variants) {
              const existingVarMapping = await this.mappingRepo.findOne({
                where: { dispensary_id: dispensaryId, external_variant_id: variant.externalId, provider: integration.provider },
              });
              if (!existingVarMapping && mapping) {
                const variantId = await this.findOrCreateVariant(mapping.internal_product_id, dispensaryId, variant);
                if (variantId) {
                  await this.mappingRepo.save(this.mappingRepo.create({
                    dispensary_id: dispensaryId,
                    internal_product_id: mapping.internal_product_id,
                    internal_variant_id: variantId,
                    external_product_id: posProduct.externalId,
                    external_variant_id: variant.externalId,
                    provider: integration.provider,
                    match_method: 'auto',
                    is_confirmed: true,
                    last_synced_at: new Date(),
                  }));
                }
              }
            }
          }
        } catch (err: any) {
          this.logger.error(`Failed to sync POS product ${posProduct.externalId}: ${err.message}`);
          failed++;
        }
      }

      syncLog.status = 'success';
      syncLog.items_processed = posProducts.length;
      syncLog.items_created = created;
      syncLog.items_updated = updated;
      syncLog.items_failed = failed;
      syncLog.duration_ms = Date.now() - startTime;

      await this.integrationRepo.update({ dispensary_id: dispensaryId }, {
        last_sync_at: new Date(), last_sync_status: 'success', last_sync_error: undefined,
      });
    } catch (err: any) {
      syncLog.status = 'failed';
      syncLog.error_message = err.message;
      syncLog.duration_ms = Date.now() - startTime;

      await this.integrationRepo.update({ dispensary_id: dispensaryId }, {
        last_sync_at: new Date(), last_sync_status: 'failed', last_sync_error: err.message,
      });
    }

    return this.syncLogRepo.save(syncLog);
  }

  // ── Inventory Sync (bidirectional) ────────────────────────────────────────

  async syncInventory(dispensaryId: string): Promise<PosSyncLog> {
    const startTime = Date.now();
    const { adapter, integration } = await this.getAdapterForDispensary(dispensaryId);

    const syncLog = this.syncLogRepo.create({
      dispensary_id: dispensaryId,
      provider: integration.provider,
      sync_type: 'inventory_sync',
      status: 'running',
    });
    await this.syncLogRepo.save(syncLog);

    try {
      const posInventory = await adapter.fetchInventory();
      let updated = 0, failed = 0;

      for (const item of posInventory) {
        try {
          const mapping = await this.mappingRepo.findOne({
            where: { dispensary_id: dispensaryId, external_variant_id: item.externalVariantId, provider: integration.provider },
          });

          if (mapping?.internal_variant_id) {
            // Update local inventory from POS
            await this._q(
              `UPDATE inventory SET quantity_on_hand = $1, quantity_available = $1 - quantity_reserved, updated_at = NOW()
               WHERE dispensary_id = $2 AND variant_id = $3`,
              [item.quantity, dispensaryId, mapping.internal_variant_id],
            );
            updated++;
          }
        } catch (err: any) {
          failed++;
        }
      }

      syncLog.status = 'success';
      syncLog.items_processed = posInventory.length;
      syncLog.items_updated = updated;
      syncLog.items_failed = failed;
      syncLog.duration_ms = Date.now() - startTime;
    } catch (err: any) {
      syncLog.status = 'failed';
      syncLog.error_message = err.message;
      syncLog.duration_ms = Date.now() - startTime;
    }

    return this.syncLogRepo.save(syncLog);
  }

  // ── Order Push (CannaSaas → POS) ──────────────────────────────────────────

  async pushOrderToPos(orderId: string, dispensaryId: string): Promise<{ success: boolean; externalOrderId?: string; error?: string }> {
    const { adapter } = await this.getAdapterForDispensary(dispensaryId);

    // Get order + line items with mappings
    const [order] = await this._q(
      `SELECT o.*, d.state FROM orders o JOIN dispensaries d ON d.entity_id = o."dispensaryId" WHERE o."orderId" = $1`,
      [orderId],
    );
    if (!order) return { success: false, error: 'Order not found' };

    const lineItems = await this._q(
      `SELECT li.*, pm.external_product_id, pm.external_variant_id
       FROM order_line_items li
       LEFT JOIN pos_product_mappings pm ON pm.internal_product_id = li."productId"
         AND pm.internal_variant_id = li."variantId" AND pm.dispensary_id = $2
       WHERE li."orderId" = $1`,
      [orderId, dispensaryId],
    );

    const mappedItems = lineItems
      .filter((li: any) => li.external_product_id)
      .map((li: any) => ({
        externalProductId: li.external_product_id,
        externalVariantId: li.external_variant_id ?? li.external_product_id,
        quantity: parseInt(li.quantity, 10),
        price: parseFloat(li.unitPrice),
      }));

    if (mappedItems.length === 0) {
      return { success: false, error: 'No POS-mapped line items found' };
    }

    try {
      const result = await adapter.pushOrder({
        items: mappedItems,
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.taxTotal),
        total: parseFloat(order.total),
        orderType: order.orderType ?? 'pickup',
      });

      // Log sync
      await this.syncLogRepo.save(this.syncLogRepo.create({
        dispensary_id: dispensaryId,
        provider: (await this.getIntegration(dispensaryId))?.provider ?? 'unknown',
        sync_type: 'order_push',
        status: 'success',
        items_processed: 1,
        items_created: 1,
      }));

      return { success: true, externalOrderId: result.externalOrderId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ── Scheduled Sync ────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync(): Promise<void> {
    const integrations = await this.integrationRepo.find({
      where: { is_active: true, is_sync_enabled: true },
    });

    for (const integration of integrations) {
      try {
        this.logger.log(`Scheduled sync for ${integration.dispensary_id} (${integration.provider})`);
        await this.syncInventory(integration.dispensary_id);
      } catch (err: any) {
        this.logger.error(`Scheduled sync failed for ${integration.dispensary_id}: ${err.message}`);
      }
    }
  }

  // ── Sync Logs ─────────────────────────────────────────────────────────────

  async getSyncLogs(dispensaryId: string, limit = 20): Promise<PosSyncLog[]> {
    return this.syncLogRepo.find({
      where: { dispensary_id: dispensaryId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getMappings(dispensaryId: string): Promise<PosProductMapping[]> {
    return this.mappingRepo.find({
      where: { dispensary_id: dispensaryId },
      order: { created_at: 'DESC' },
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async autoMatchProduct(dispensaryId: string, posProduct: any): Promise<string | null> {
    // Try SKU match first
    if (posProduct.variants?.[0]?.sku) {
      const [match] = await this._q(
        `SELECT p.id FROM products p JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.dispensary_id = $1 AND pv.sku = $2 LIMIT 1`,
        [dispensaryId, posProduct.variants[0].sku],
      );
      if (match) return match.id;
    }

    // Try name match
    const [nameMatch] = await this._q(
      `SELECT id FROM products WHERE dispensary_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [dispensaryId, posProduct.name],
    );
    return nameMatch?.id ?? null;
  }

  private async createProductFromPos(dispensaryId: string, posProduct: any): Promise<string> {
    const [result] = await this._q(
      `INSERT INTO products (id, dispensary_id, name, description, strain_type, thc_percent, cbd_percent, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING id`,
      [dispensaryId, posProduct.name, posProduct.description, posProduct.strainType, posProduct.thcContent, posProduct.cbdContent],
    );
    return result.id;
  }

  private async updateProductFromPos(productId: string, dispensaryId: string, posProduct: any): Promise<void> {
    await this._q(
      `UPDATE products SET description = COALESCE($1, description), strain_type = COALESCE($2, strain_type),
       thc_percent = COALESCE($3, thc_percent), cbd_percent = COALESCE($4, cbd_percent), updated_at = NOW()
       WHERE id = $5 AND dispensary_id = $6`,
      [posProduct.description, posProduct.strainType, posProduct.thcContent, posProduct.cbdContent, productId, dispensaryId],
    );
  }

  private async findOrCreateVariant(productId: string, dispensaryId: string, variant: any): Promise<string | null> {
    // Try find by SKU
    if (variant.sku) {
      const [existing] = await this._q(
        `SELECT variant_id FROM product_variants WHERE product_id = $1 AND sku = $2 LIMIT 1`,
        [productId, variant.sku],
      );
      if (existing) return existing.variant_id;
    }

    // Create new variant
    const [result] = await this._q(
      `INSERT INTO product_variants (variant_id, product_id, dispensary_id, name, sku, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()) RETURNING variant_id`,
      [productId, dispensaryId, variant.name ?? 'Default', variant.sku],
    );
    return result?.variant_id ?? null;
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
