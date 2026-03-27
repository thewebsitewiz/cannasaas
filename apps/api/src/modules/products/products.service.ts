import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPricing } from './entities/product-pricing.entity';
import { LkpProductType, LkpProductCategory } from './entities/lookups/lookups.entity';
import { CacheService } from '../../common/services/cache.service';

export interface ProductsFilter {
  dispensaryId: string;
  productTypeId?: number;
  categoryId?: number;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductPricing) private pricingRepo: Repository<ProductPricing>,
    @InjectRepository(LkpProductType) private productTypeRepo: Repository<LkpProductType>,
    @InjectRepository(LkpProductCategory) private categoryRepo: Repository<LkpProductCategory>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  async findAll(filter: ProductsFilter): Promise<Product[]> {
    // Build a stable cache key from the filter (only cache non-search queries)
    if (!filter.search) {
      const cacheKey = `products:${filter.dispensaryId}:${filter.productTypeId ?? ''}:${filter.categoryId ?? ''}:${filter.isActive ?? ''}:${filter.limit ?? 20}:${filter.offset ?? 0}`;
      const cached = await this.cache.get<Product[]>(cacheKey);
      if (cached) return cached;

      const results = await this._queryProducts(filter);
      await this.cache.set(cacheKey, results, 60);
      return results;
    }

    return this._queryProducts(filter);
  }

  private async _queryProducts(filter: ProductsFilter): Promise<Product[]> {
    const where: any = { dispensary_id: filter.dispensaryId };
    if (filter.isActive !== undefined) where.is_active = filter.isActive;
    if (filter.productTypeId) where.product_type_id = filter.productTypeId;
    if (filter.categoryId) where.primary_category_id = filter.categoryId;

    const options: FindManyOptions<Product> = {
      where: filter.search
        ? [
            { ...where, name: ILike(`%${filter.search}%`) },
            { ...where, description: ILike(`%${filter.search}%`) },
          ]
        : where,
      order: { name: 'ASC' },
      take: filter.limit ?? 20,
      skip: filter.offset ?? 0,
    };
    return this.productRepo.find(options);
  }

  async findById(id: string, dispensaryId?: string): Promise<Product> {
    const where: any = { id };
    if (dispensaryId) where.dispensary_id = dispensaryId;
    const product = await this.productRepo.findOne({ where });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findVariants(productId: string, dispensaryId: string): Promise<ProductVariant[]> {
    return this.variantRepo.find({
      where: { product_id: productId, dispensary_id: dispensaryId, is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async findCurrentPricing(variantId: string): Promise<ProductPricing | null> {
    const now = new Date();
    return this.pricingRepo
      .createQueryBuilder('p')
      .where('p.variant_id = :variantId', { variantId })
      .andWhere('p.price_type = :type', { type: 'retail' })
      .andWhere('p.effective_from <= :now', { now })
      .andWhere('(p.effective_until IS NULL OR p.effective_until > :now)', { now })
      .orderBy('p.effective_from', 'DESC')
      .getOne();
  }

  async findProductTypes(): Promise<LkpProductType[]> {
    return this.productTypeRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
  }

  async findCategories(): Promise<LkpProductCategory[]> {
    return this.categoryRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
  }

  async countByDispensary(dispensaryId: string): Promise<number> {
    return this.productRepo.count({ where: { dispensary_id: dispensaryId, is_active: true } });
  }

  // ═══ CRUD ═══

  async createProduct(input: any): Promise<Product> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const product = this.productRepo.create({
        dispensary_id: input.dispensaryId,
        name: input.name,
        description: input.description,
        strain_type: input.strainType,
        strain_name: input.strainName,
        thc_percent: input.thcPercent,
        cbd_percent: input.cbdPercent,
        is_active: input.isActive ?? true,
      });
      const saved = await qr.manager.save(product);

      // Create default variant if name or price provided
      const variantName = input.variantName || '3.5g Jar';
      const variant = this.variantRepo.create({
        product_id: saved.id,
        dispensary_id: input.dispensaryId,
        name: variantName,
        quantity_per_unit: input.variantQuantityG ?? 3.5,
        sku: `SKU-${saved.id.slice(0, 8)}`,
        is_active: true,
      });
      const savedVariant = await qr.manager.save(variant);

      // Create pricing if provided
      if (input.retailPrice) {
        await qr.query(
          `INSERT INTO product_pricing (variant_id, dispensary_id, price_type, price, effective_from)
           VALUES ($1, $2, 'retail', $3, NOW())`,
          [savedVariant.variant_id, input.dispensaryId, input.retailPrice],
        );
      }

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateProduct(input: any): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: input.productId, dispensary_id: input.dispensaryId },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (input.name !== undefined) product.name = input.name;
    if (input.description !== undefined) product.description = input.description;
    if (input.strainType !== undefined) product.strain_type = input.strainType;
    if (input.strainName !== undefined) product.strain_name = input.strainName;
    if (input.thcPercent !== undefined) product.thc_percent = input.thcPercent;
    if (input.cbdPercent !== undefined) product.cbd_percent = input.cbdPercent;
    if (input.isActive !== undefined) product.is_active = input.isActive;
    if (input.isApproved !== undefined) product.is_approved = input.isApproved;

    return this.productRepo.save(product);
  }

  async updateVariantPrice(variantId: string, dispensaryId: string, price: number): Promise<void> {
    // Expire current pricing
    await this.dataSource.query(
      `UPDATE product_pricing SET effective_until = NOW() WHERE variant_id = $1 AND dispensary_id = $2 AND effective_until IS NULL`,
      [variantId, dispensaryId],
    );
    // Insert new
    await this.dataSource.query(
      `INSERT INTO product_pricing (variant_id, dispensary_id, price_type, price, effective_from)
       VALUES ($1, $2, 'retail', $3, NOW())`,
      [variantId, dispensaryId, price],
    );
  }

  async deleteProduct(productId: string, dispensaryId: string): Promise<boolean> {
    const result = await this.productRepo.softDelete({ id: productId, dispensary_id: dispensaryId });
    return (result.affected ?? 0) > 0;
  }
}
