import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private uploadService: UploadService,
  ) {}

  // --- Categories ---

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Get('categories')
  findCategories(@Query('dispensaryId') dispensaryId: string) {
    return this.productsService.findCategories(dispensaryId);
  }

  // --- Products ---

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get()
  findAll(
    @Query('dispensaryId') dispensaryId: string,
    @Query('categoryId') categoryId?: string,
    @Query('productType') productType?: string,
    @Query('strainType') strainType?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findProducts(dispensaryId, {
      categoryId,
      productType,
      strainType,
      isFeatured: featured === 'true' ? true : undefined,
      search,
    });
  }

  @Get('low-stock')
  getLowStock(@Query('dispensaryId') dispensaryId: string) {
    return this.productsService.getLowStockProducts(dispensaryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  // --- Inventory ---

  @Put('variants/:variantId/inventory')
  updateInventory(
    @Param('variantId') variantId: string,
    @Body() body: { quantityChange: number },
  ) {
    return this.productsService.updateInventory(variantId, body.quantityChange);
  }

  // --- Images ---

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('primary') primary?: string,
  ) {
    const imageUrl = await this.uploadService.uploadFile(
      file,
      `products/${id}`,
    );
    return this.productsService.addProductImage(
      id,
      imageUrl,
      primary === 'true',
    );
  }
}
