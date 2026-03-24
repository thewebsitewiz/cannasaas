import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { PromotionProduct } from './entities/promotion-product.entity';
import { PromotionCategory } from './entities/promotion-category.entity';
import { PromotionsService } from './promotions.service';
import { PromotionsResolver } from './promotions.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionProduct, PromotionCategory])],
  providers: [PromotionsService, PromotionsResolver],
  exports: [TypeOrmModule, PromotionsService],
})
export class PromotionsModule {}
