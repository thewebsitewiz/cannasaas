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
    findCategories(dispensaryId: string): Promise<{}>;
    create(dto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    findAll(dispensaryId: string, categoryId?: string, productType?: string, strainType?: string, featured?: string, search?: string): Promise<{}>;
    getLowStock(dispensaryId: string): any;
    findOne(id: string): Promise<import("./entities/product.entity").Product>;
    update(id: string, dto: UpdateProductDto): Promise<import("./entities/product.entity").Product>;
    remove(id: string): any;
    updateInventory(variantId: string, body: {
        quantityChange: number;
    }): any;
    uploadImage(id: string, file: Express.Multer.File, primary?: string): unknown;
}
