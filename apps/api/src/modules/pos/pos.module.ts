import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosIntegration } from './entities/pos-integration.entity';
import { PosProductMapping } from './entities/pos-product-mapping.entity';
import { PosSyncLog } from './entities/pos-sync-log.entity';
import { PosService } from './pos.service';
import { PosResolver } from './pos.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([PosIntegration, PosProductMapping, PosSyncLog])],
  providers: [PosService, PosResolver],
  exports: [PosService],
})
export class PosModule {}
