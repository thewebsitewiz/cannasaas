import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';

@Module({
  imports: [
    MulterModule.register({ storage: require('multer').memoryStorage() }),
  ],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
