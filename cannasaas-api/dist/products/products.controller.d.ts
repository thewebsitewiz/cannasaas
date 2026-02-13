import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class ProductsController {
    private productsService;
    private uploadService;
    constructor(productsService: ProductsService, uploadService: UploadService);
    createCategory(dto: CreateCategoryDto): Promise<import("./entities/category.entity").Category>;
    findCategories(dispensaryId: string): Promise<import("./entities/category.entity").Category[]>;
    create(dto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    findAll(dispensaryId: string, categoryId?: string, productType?: string, strainType?: string, featured?: string, search?: string): Promise<import("./entities/product.entity").Product[]>;
    getLowStock(dispensaryId: string): Promise<import("./entities/product-variant.entity").ProductVariant[]>;
    findOne(id: string): Promise<import("./entities/product.entity").Product>;
    update(id: string, dto: UpdateProductDto): Promise<import("./entities/product.entity").Product>;
    remove(id: string): Promise<void>;
    updateInventory(variantId: string, body: {
        quantityChange: number;
    }): Promise<import("./entities/product-variant.entity").ProductVariant>;
    uploadImage(id: string, file: Express.Multer.File, primary?: string): Promise<import("./entities/product-image.entity").ProductImage>;
}
