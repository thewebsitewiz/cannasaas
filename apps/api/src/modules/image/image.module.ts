import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';

interface MulterModuleShape {
  memoryStorage(): unknown;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer') as MulterModuleShape;

@Module({
  imports: [MulterModule.register({ storage: multer.memoryStorage() })],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
