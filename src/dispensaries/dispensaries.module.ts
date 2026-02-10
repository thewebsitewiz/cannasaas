import { AuthModule } from 'src/auth/auth.module';
import { BrandingConfig } from './entities/branding-config.entity';
import { DispensariesController } from './dispensaries.controller';
import { DispensariesService } from './dispensaries.service';
import { Dispensary } from './entities/dispensary.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispensary, BrandingConfig]),
    UploadModule,
    AuthModule,
  ],
  controllers: [DispensariesController],
  providers: [DispensariesService],
  exports: [DispensariesService],
})
export class DispensariesModule {}
