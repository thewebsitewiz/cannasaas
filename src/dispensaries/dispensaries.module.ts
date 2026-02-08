import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispensariesService } from './dispensaries.service';
import { DispensariesController } from './dispensaries.controller';
import { Dispensary } from './entities/dispensary.entity';
import { BrandingConfig } from './entities/branding-config.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispensary, BrandingConfig]),
    UploadModule,
  ],
  controllers: [DispensariesController],
  providers: [DispensariesService],
  exports: [DispensariesService],
})
export class DispensariesModule {}