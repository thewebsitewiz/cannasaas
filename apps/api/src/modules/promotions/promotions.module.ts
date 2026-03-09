import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { PromotionProduct } from './entities/promotion-product.entity';
import { PromotionCategory } from './entities/promotion-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionProduct, PromotionCategory])],
  exports: [TypeOrmModule],
})
export class PromotionsModule {}
