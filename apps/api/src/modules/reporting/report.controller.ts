import { Controller, Get, Query as QueryParam, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportingService } from './reporting.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('sales/csv')
  async salesCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) { res.status(400).json({ error: 'dispensaryId, startDate, endDate required' }); return; }
    const csv = await this.reporting.generateSalesCsv(dispensaryId, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${startDate}-to-${endDate}.csv"`);
    res.send(csv);
  }

  @Get('tax/csv')
  async taxCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) { res.status(400).json({ error: 'dispensaryId, startDate, endDate required' }); return; }
    const csv = await this.reporting.generateTaxCsv(dispensaryId, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tax-report-${startDate}-to-${endDate}.csv"`);
    res.send(csv);
  }

  @Get('staff/csv')
  async staffCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @QueryParam('startDate') startDate: string,
    @QueryParam('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) { res.status(400).json({ error: 'dispensaryId, startDate, endDate required' }); return; }
    const csv = await this.reporting.generateStaffCsv(dispensaryId, startDate, endDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="staff-performance-${startDate}-to-${endDate}.csv"`);
    res.send(csv);
  }

  @Get('inventory/csv')
  async inventoryCsv(
    @QueryParam('dispensaryId') dispensaryId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId) { res.status(400).json({ error: 'dispensaryId required' }); return; }
    const csv = await this.reporting.generateInventoryCsv(dispensaryId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-valuation-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }
}
