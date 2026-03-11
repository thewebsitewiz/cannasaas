import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPricing } from './entities/product-pricing.entity';
import { LkpProductType, LkpProductCategory } from './entities/lookups/lookups.entity';

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
  ) {}

  async findAll(filter: ProductsFilter): Promise<Product[]> {
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
}
