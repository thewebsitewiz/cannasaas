import { Module } from '@nestjs/common';
import { BiotrackCredential } from './entities/biotrack-credential.entity';
import { BiotrackService } from './biotrack.service';
import { BiotrackResolver } from './biotrack.resolver';

@Module({
  providers: [BiotrackService, BiotrackResolver],
  exports: [BiotrackService],
})
export class BiotrackModule {}
