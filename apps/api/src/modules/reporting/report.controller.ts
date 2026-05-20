import {
  Controller,
  ForbiddenException,
  Get,
  Query as QueryParam,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportingService } from './reporting.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * CSV report exports. Every endpoint is dispensary-scoped — the
 * caller's JWT role must permit the read AND their dispensaryId must
 * match the requested dispensaryId (super_admin can cross tenants).
 *
 * Pre-sc-609-followup the controller used a bare `@UseGuards(AuthGuard('jwt'))`
 * and no role/tenant check, which let any signed-in user — including a
 * budtender — download any dispensary's full sales, tax, staff, or
 * inventory data via direct URL.
 */
@Controller('reports')
export class ReportController {
  constructor(private readonly reporting: ReportingService) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('sales/csv')
  async salesCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) {
      res
        .status(400)
        .json({ error: 'dispensaryId, startDate, endDate required' });
      return;
    }
    guardTenant(user, dispensaryId);
    const csv = await this.reporting.generateSalesCsv(
      dispensaryId,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales-${startDate}-to-${endDate}.csv"`,
    );
    res.send(csv);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('tax/csv')
  async taxCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) {
      res
        .status(400)
        .json({ error: 'dispensaryId, startDate, endDate required' });
      return;
    }
    guardTenant(user, dispensaryId);
    const csv = await this.reporting.generateTaxCsv(
      dispensaryId,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tax-report-${startDate}-to-${endDate}.csv"`,
    );
    res.send(csv);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('staff/csv')
  async staffCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) {
      res
        .status(400)
        .json({ error: 'dispensaryId, startDate, endDate required' });
      return;
    }
    guardTenant(user, dispensaryId);
    const csv = await this.reporting.generateStaffCsv(
      dispensaryId,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="staff-performance-${startDate}-to-${endDate}.csv"`,
    );
    res.send(csv);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('inventory/csv')
  async inventoryCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId) {
      res.status(400).json({ error: 'dispensaryId required' });
      return;
    }
    guardTenant(user, dispensaryId);
    const csv = await this.reporting.generateInventoryCsv(dispensaryId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="inventory-valuation-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csv);
  }
}

function guardTenant(user: JwtPayload, dispensaryId: string): void {
  if (user.role !== 'super_admin' && user.dispensaryId !== dispensaryId) {
    throw new ForbiddenException('Cross-dispensary report access denied');
  }
}
