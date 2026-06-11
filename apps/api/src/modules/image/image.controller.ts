import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Param,
  Req,
  ForbiddenException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ImageService,
  UploadedFile as UploadedFileShape,
} from './image.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DispensaryOwnershipService } from '../../common/services/dispensary-ownership.service';

interface AuthedRequest extends Request {
  user?: {
    sub: string;
    role: string;
    dispensaryId?: string;
    organizationId?: string;
  };
}

interface ProductImageRow {
  image_url: string | null;
  thumbnail_url: string | null;
}

interface ProductDispensaryRow {
  dispensary_id: string | null;
}

@Controller('images')
export class ImageController {
  constructor(
    private readonly images: ImageService,
    @InjectDataSource() private ds: DataSource,
    private readonly ownership: DispensaryOwnershipService,
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
    const dispensaryId = await this.assertProductInCallerTenant(productId, req);
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
    const dispensaryId = await this.assertProductInCallerTenant(productId, req);
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
  async deleteProductImage(
    @Param('productId') productId: string,
    @Req() req: AuthedRequest,
  ) {
    await this.assertProductInCallerTenant(productId, req);
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

  /**
   * Per-dispensary branding logo. Multipart upload, 2 MB cap (smaller
   * than the masthead because a logo is usually a square mark, not a
   * hero photo). Writes the URL into `theme_configs.logo_url`.
   */
  @Post('dispensary/:dispensaryId/logo')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  async uploadDispensaryLogo(
    @UploadedFile() file: UploadedFileShape,
    @Param('dispensaryId') dispensaryId: string,
    @Req() req: AuthedRequest,
  ) {
    await this.ownership.assertOwns(req.user, dispensaryId);
    const result = await this.images.uploadBranding(file, dispensaryId, 'logo');
    await this.upsertThemeBrandingColumn(dispensaryId, 'logo_url', result.url);
    return { success: true, url: result.url };
  }

  /**
   * Per-dispensary masthead image (hero banner). Multipart upload, 5 MB cap.
   * Writes the URL into `theme_configs.masthead_url`.
   */
  @Post('dispensary/:dispensaryId/masthead')
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadDispensaryMasthead(
    @UploadedFile() file: UploadedFileShape,
    @Param('dispensaryId') dispensaryId: string,
    @Req() req: AuthedRequest,
  ) {
    await this.ownership.assertOwns(req.user, dispensaryId);
    const result = await this.images.uploadBranding(
      file,
      dispensaryId,
      'masthead',
    );
    await this.upsertThemeBrandingColumn(
      dispensaryId,
      'masthead_url',
      result.url,
    );
    return { success: true, url: result.url };
  }

  /**
   * Upsert a single branding column on the dispensary's `theme_configs`
   * row, creating the row with defaults if it doesn't exist yet. Kept
   * inline rather than pushed into ThemeService to avoid a circular
   * dependency between the image module and the theme module.
   */
  private async upsertThemeBrandingColumn(
    dispensaryId: string,
    column: 'logo_url' | 'masthead_url',
    value: string,
  ): Promise<void> {
    await this.ds.query(
      `INSERT INTO theme_configs (dispensary_id, ${column}, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (dispensary_id)
       DO UPDATE SET ${column} = EXCLUDED.${column}, updated_at = NOW()`,
      [dispensaryId, value],
    );
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
    if (!userId) throw new ForbiddenException('Not authenticated');
    const result = await this.images.uploadAvatar(file, userId);
    return { success: true, ...result };
  }

  /**
   * Resolves the product's owning dispensary and verifies the caller
   * is authorized for it (super_admin bypasses). Pre-sc-609-followup
   * the image endpoints used the caller's own `dispensaryId` blindly
   * — a dispensary_admin of tenant A could mutate any product's image
   * in the database, including tenant B's products.
   */
  private async assertProductInCallerTenant(
    productId: string,
    req: AuthedRequest,
  ): Promise<string> {
    const rows = (await this.ds.query(
      'SELECT dispensary_id FROM products WHERE id = $1',
      [productId],
    )) as unknown as ProductDispensaryRow[];
    const owner = rows[0]?.dispensary_id;
    if (!owner) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role !== 'super_admin' && user.dispensaryId !== owner) {
      throw new ForbiddenException('Product belongs to a different dispensary');
    }
    return owner;
  }
}
