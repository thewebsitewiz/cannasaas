import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // --- Categories ---

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findCategories(dispensaryId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { dispensaryId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['products'],
    });
  }

  // --- Products ---

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const { variants, ...productData } = dto;

    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    // Create variants
    if (variants && variants.length > 0) {
      const variantEntities = variants.map((v, index) =>
        this.variantRepository.create({
          ...v,
          productId: savedProduct.id,
          sortOrder: index,
        }),
      );
      await this.variantRepository.save(variantEntities);
    }

    return this.findOneProduct(savedProduct.id);
  }

  async findProducts(
    dispensaryId: string,
    filters?: {
      categoryId?: string;
      productType?: string;
      strainType?: string;
      isFeatured?: boolean;
      search?: string;
    },
  ): Promise<Product[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.dispensaryId = :dispensaryId', { dispensaryId })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (filters?.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.productType) {
      qb.andWhere('product.productType = :productType', {
        productType: filters.productType,
      });
    }

    if (filters?.strainType) {
      qb.andWhere('product.strainType = :strainType', {
        strainType: filters.strainType,
      });
    }

    if (filters?.isFeatured !== undefined) {
      qb.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: filters.isFeatured,
      });
    }

    if (filters?.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('product.isFeatured', 'DESC')
      .addOrderBy('product.name', 'ASC')
      .addOrderBy('variant.sortOrder', 'ASC')
      .addOrderBy('image.sortOrder', 'ASC');

    return qb.getMany();
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'images', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneProduct(id);
    const { variants, ...productData } = dto;

    Object.assign(product, productData);
    await this.productRepository.save(product);
    // Update variants if provided
    if (variants) {
      // Remove existing variants and replace
      await this.variantRepository.delete({ productId: id });
      const variantEntities = variants.map((v, index) =>
        this.variantRepository.create({
          ...v,
          productId: id,
          sortOrder: index,
        }),
      );
      await this.variantRepository.save(variantEntities);
    }

    return this.findOneProduct(id);
  }

  async removeProduct(id: string): Promise<void> {
    const product = await this.findOneProduct(id);
    await this.productRepository.remove(product);
  }

  // --- Inventory ---

  async updateInventory(
    variantId: string,
    quantityChange: number,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    variant.quantity += quantityChange;
    if (variant.quantity < 0) variant.quantity = 0;

    return this.variantRepository.save(variant);
  }

  async getLowStockProducts(dispensaryId: string): Promise<ProductVariant[]> {
    return this.variantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('product.dispensaryId = :dispensaryId', { dispensaryId })
      .andWhere('variant.quantity <= variant.lowStockThreshold')
      .andWhere('variant.isActive = true')
      .getMany();
  }

  // --- Product Images ---

  async addProductImage(
    productId: string,
    imageUrl: string,
    isPrimary: boolean = false,
  ): Promise<ProductImage> {
    // If setting as primary, unset existing primary
    if (isPrimary) {
      await this.imageRepository.update({ productId }, { isPrimary: false });
    }

    const image = this.imageRepository.create({
      productId,
      imageUrl,
      isPrimary,
    });

    return this.imageRepository.save(image);
  }
}
