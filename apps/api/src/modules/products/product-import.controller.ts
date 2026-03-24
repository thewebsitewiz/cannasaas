import { Controller, Post, Get, Query, Res, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { ProductImportService } from './product-import.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('v1/products')
export class ProductImportController {
  constructor(private readonly importService: ProductImportService) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('export')
  async exportProducts(
    @Query('dispensaryId') dispensaryId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const targetId = dispensaryId || user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }

    const csv = await this.importService.exportProducts(targetId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products-export.csv');
    res.send(csv);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('import-template')
  async getTemplate(@Res() res: Response): Promise<void> {
    const csv = this.importService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products-import-template.csv');
    res.send(csv);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Post('import')
  async importProducts(
    @Body('csvContent') csvContent: string,
    @Body('dispensaryId') dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const targetId = dispensaryId || user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }

    return this.importService.importProducts(targetId, csvContent);
  }
}
