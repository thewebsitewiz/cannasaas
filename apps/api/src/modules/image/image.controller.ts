import { Inject, Controller, Post, Delete, UseInterceptors, UploadedFile, Param, Req, UseGuards, HttpCode, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImageService } from './image.service';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Controller('images')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImageController {
  constructor(
    private readonly images: ImageService,
    @Inject(DRIZZLE) private db: any
  ) {}

  @Post('product/:productId')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadProductImage(
    @UploadedFile() file: any,
    @Param('productId') productId: string,
    @Req() req: any
  ) {
    const dispensaryId = req.user?.dispensaryId || req.headers['x-dispensary-id'];
    const result = await this.images.uploadProductImage(file, dispensaryId, productId);

    // Update product with image URL
    await this._q('UPDATE products SET image_url = $1, thumbnail_url = $2, updated_at = NOW() WHERE id = $3', [result.url, result.thumbnailUrl, productId]);

    return { success: true, ...result };
  }

  @Post('product/:productId/gallery')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async addGalleryImage(
    @UploadedFile() file: any,
    @Param('productId') productId: string,
    @Req() req: any
  ) {
    const dispensaryId = req.user?.dispensaryId || req.headers['x-dispensary-id'];
    const result = await this.images.uploadProductImage(file, dispensaryId, productId);

    // Add to gallery JSONB array
    await this._q(
      `UPDATE products SET gallery_urls = COALESCE(gallery_urls, '[]'::JSONB) || $1::JSONB, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify([result.url]), productId],
    );

    return { success: true, ...result };
  }

  @Delete('product/:productId')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @HttpCode(200)
  async deleteProductImage(@Param('productId') productId: string) {
    const [product] = await this._q('SELECT image_url, thumbnail_url FROM products WHERE id = $1', [productId]);
    if (product?.image_url) this.images.deleteFile(product.image_url);
    if (product?.thumbnail_url) this.images.deleteFile(product.thumbnail_url);
    await this._q('UPDATE products SET image_url = NULL, thumbnail_url = NULL, updated_at = NOW() WHERE id = $1', [productId]);
    return { success: true };
  }

  @Post('avatar')
  @Roles('customer', 'budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
    const result = await this.images.uploadAvatar(file, req.user.sub);
    return { success: true, ...result };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
