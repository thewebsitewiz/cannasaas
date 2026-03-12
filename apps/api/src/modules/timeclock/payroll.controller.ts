import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TimeClockService } from './timeclock.service';

@Controller('payroll')
@UseGuards(AuthGuard('jwt'))
export class PayrollController {
  constructor(private readonly timeClock: TimeClockService) {}

  @Get('export')
  async exportCsv(
    @Query('dispensaryId') dispensaryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) {
      res.status(400).json({ error: 'dispensaryId, startDate, and endDate are required' });
      return;
    }

    const csv = await this.timeClock.generatePayrollCsv(dispensaryId, startDate, endDate);
    const filename = `payroll-${startDate}-to-${endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
