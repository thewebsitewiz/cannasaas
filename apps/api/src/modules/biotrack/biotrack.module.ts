import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiotrackCredential } from './entities/biotrack-credential.entity';
import { BiotrackService } from './biotrack.service';
import { BiotrackResolver } from './biotrack.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([BiotrackCredential])],
  providers: [BiotrackService, BiotrackResolver],
  exports: [BiotrackService],
})
export class BiotrackModule {}
