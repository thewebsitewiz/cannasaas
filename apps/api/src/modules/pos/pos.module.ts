import { Module } from '@nestjs/common';
import { PosIntegration } from './entities/pos-integration.entity';
import { PosProductMapping } from './entities/pos-product-mapping.entity';
import { PosSyncLog } from './entities/pos-sync-log.entity';
import { PosService } from './pos.service';
import { PosResolver } from './pos.resolver';

@Module({
  providers: [PosService, PosResolver],
  exports: [PosService],
})
export class PosModule {}
