import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class ProductsService {
    private productRepository;
    private variantRepository;
    private imageRepository;
    private categoryRepository;
    constructor(productRepository: Repository<Product>, variantRepository: Repository<ProductVariant>, imageRepository: Repository<ProductImage>, categoryRepository: Repository<Category>);
    createCategory(dto: CreateCategoryDto): Promise<Category>;
    findCategories(dispensaryId: string): Promise<Category[]>;
    createProduct(dto: CreateProductDto): Promise<Product>;
    findProducts(dispensaryId: string, filters?: {
        categoryId?: string;
        productType?: string;
        strainType?: string;
        isFeatured?: boolean;
        search?: string;
    }): Promise<Product[]>;
    findOneProduct(id: string): Promise<Product>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<Product>;
    removeProduct(id: string): Promise<void>;
    updateInventory(variantId: string, quantityChange: number): Promise<ProductVariant>;
    getLowStockProducts(dispensaryId: string): Promise<ProductVariant[]>;
    addProductImage(productId: string, imageUrl: string, isPrimary?: boolean): Promise<ProductImage>;
}
