import { Module } from '@nestjs/common';
import { ProductsResolver, ProductVariantResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { ProductSearchService } from './product-search.service';
import { ProductImportService } from './product-import.service';
import { ProductImportController } from './product-import.controller';

@Module({
  controllers: [ProductImportController],
  providers: [ProductsResolver, ProductVariantResolver, ProductsService, ProductSearchService, ProductImportService],
  exports: [ProductsService, ProductImportService],
})
export class ProductsModule {}
