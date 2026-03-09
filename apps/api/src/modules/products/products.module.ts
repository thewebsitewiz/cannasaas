import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPricing } from './entities/product-pricing.entity';
import { ProductBatch } from './entities/product-batch.entity';
import { LabTest, LabTestResult } from './entities/lab-test.entity';
import {
  LkpProductType, LkpProductCategory, LkpUnitOfMeasure,
  LkpPackagingType, LkpExtractionMethod, LkpMetrcItemCategory,
  LkpTaxCategory, LkpEffect, LkpFlavor, LkpTerpene,
  LkpCannabinoid, LkpAllergen, LkpWarningStatement,
  LkpLabTestCategory, LkpMetrcAdjustmentReason,
} from './entities/lookups/lookups.entity';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Product, ProductVariant, ProductPricing, ProductBatch,
    LabTest, LabTestResult,
    LkpProductType, LkpProductCategory, LkpUnitOfMeasure,
    LkpPackagingType, LkpExtractionMethod, LkpMetrcItemCategory,
    LkpTaxCategory, LkpEffect, LkpFlavor, LkpTerpene,
    LkpCannabinoid, LkpAllergen, LkpWarningStatement,
    LkpLabTestCategory, LkpMetrcAdjustmentReason,
  ])],
  providers: [ProductsResolver, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
