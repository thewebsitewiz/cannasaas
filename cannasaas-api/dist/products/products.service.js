"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const product_variant_entity_1 = require("./entities/product-variant.entity");
const product_image_entity_1 = require("./entities/product-image.entity");
const category_entity_1 = require("./entities/category.entity");
let ProductsService = class ProductsService {
    constructor(productRepository, variantRepository, imageRepository, categoryRepository) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.imageRepository = imageRepository;
        this.categoryRepository = categoryRepository;
    }
    async createCategory(dto) {
        const category = this.categoryRepository.create(dto);
        return this.categoryRepository.save(category);
    }
    async findCategories(dispensaryId) {
        return this.categoryRepository.find({
            where: { dispensaryId, isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC' },
            relations: ['products'],
        });
    }
    async createProduct(dto) {
        const { variants, ...productData } = dto;
        const product = this.productRepository.create(productData);
        const savedProduct = await this.productRepository.save(product);
        if (variants && variants.length > 0) {
            const variantEntities = variants.map((v, index) => this.variantRepository.create({
                ...v,
                productId: savedProduct.id,
                sortOrder: index,
            }));
            await this.variantRepository.save(variantEntities);
        }
        return this.findOneProduct(savedProduct.id);
    }
    async findProducts(dispensaryId, filters) {
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
            qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)', { search: `%${filters.search}%` });
        }
        qb.orderBy('product.isFeatured', 'DESC')
            .addOrderBy('product.name', 'ASC')
            .addOrderBy('variant.sortOrder', 'ASC')
            .addOrderBy('image.sortOrder', 'ASC');
        return qb.getMany();
    }
    async findOneProduct(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['variants', 'images', 'category'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async updateProduct(id, dto) {
        const product = await this.findOneProduct(id);
        const { variants, ...productData } = dto;
        Object.assign(product, productData);
        await this.productRepository.save(product);
        `` `` `` `` `
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
      throw new NotFoundException(`;
        Variant;
        with (ID)
            $;
        {
            variantId;
        }
        not;
        found `);
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
        ;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __param(2, (0, typeorm_1.InjectRepository)(product_image_entity_1.ProductImage)),
    __param(3, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map