import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrainData } from './entities/strain-data.entity';
import { OtreebaService } from './otreeba.service';
import { ProductEnrichmentService } from './product-enrichment.service';
import { ProductDataResolver } from './product-data.resolver';
import { OtreebaSyncCron } from './otreeba-sync.cron';

@Module({
  imports: [TypeOrmModule.forFeature([StrainData])],
  providers: [OtreebaService, ProductEnrichmentService, ProductDataResolver, OtreebaSyncCron],
  exports: [OtreebaService, ProductEnrichmentService],
})
export class ProductDataModule {}
