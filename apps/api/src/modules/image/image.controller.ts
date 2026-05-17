import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Param,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ImageService,
  UploadedFile as UploadedFileShape,
} from './image.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface AuthedRequest extends Request {
  user?: { sub: string; dispensaryId?: string };
}

interface ProductImageRow {
  image_url: string | null;
  thumbnail_url: string | null;
}

@Controller('images')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImageController {
  constructor(
    private readonly images: ImageService,
    @InjectDataSource() private ds: DataSource,
  ) {}

  @Post('product/:productId')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadProductImage(
    @UploadedFile() file: UploadedFileShape,
    @Param('productId') productId: string,
    @Req() req: AuthedRequest,
  ) {
    const headerVal = req.headers['x-dispensary-id'];
    const headerDispensaryId = Array.isArray(headerVal)
      ? headerVal[0]
      : headerVal;
    const dispensaryId = req.user?.dispensaryId ?? headerDispensaryId ?? '';
    const result = await this.images.uploadProductImage(
      file,
      dispensaryId,
      productId,
    );

    await this.ds.query(
      'UPDATE products SET image_url = $1, thumbnail_url = $2, updated_at = NOW() WHERE id = $3',
      [result.url, result.thumbnailUrl, productId],
    );

    return { success: true, ...result };
  }

  @Post('product/:productId/gallery')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async addGalleryImage(
    @UploadedFile() file: UploadedFileShape,
    @Param('productId') productId: string,
    @Req() req: AuthedRequest,
  ) {
    const headerVal = req.headers['x-dispensary-id'];
    const headerDispensaryId = Array.isArray(headerVal)
      ? headerVal[0]
      : headerVal;
    const dispensaryId = req.user?.dispensaryId ?? headerDispensaryId ?? '';
    const result = await this.images.uploadProductImage(
      file,
      dispensaryId,
      productId,
    );

    await this.ds.query(
      `UPDATE products SET gallery_urls = COALESCE(gallery_urls, '[]'::JSONB) || $1::JSONB, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify([result.url]), productId],
    );

    return { success: true, ...result };
  }

  @Delete('product/:productId')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @HttpCode(200)
  async deleteProductImage(@Param('productId') productId: string) {
    const rows = (await this.ds.query(
      'SELECT image_url, thumbnail_url FROM products WHERE id = $1',
      [productId],
    )) as unknown as ProductImageRow[];
    const product = rows[0];
    if (product?.image_url) this.images.deleteFile(product.image_url);
    if (product?.thumbnail_url) this.images.deleteFile(product.thumbnail_url);
    await this.ds.query(
      'UPDATE products SET image_url = NULL, thumbnail_url = NULL, updated_at = NOW() WHERE id = $1',
      [productId],
    );
    return { success: true };
  }

  @Post('avatar')
  @Roles(
    'customer',
    'budtender',
    'shift_lead',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  async uploadAvatar(
    @UploadedFile() file: UploadedFileShape,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('Not authenticated');
    const result = await this.images.uploadAvatar(file, userId);
    return { success: true, ...result };
  }
}
