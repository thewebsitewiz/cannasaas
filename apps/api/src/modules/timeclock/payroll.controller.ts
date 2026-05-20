import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { TimeClockService } from './timeclock.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * Payroll CSV export. dispensary_admin or higher of the requested
 * tenant only — pre-sc-609-followup any signed-in user (including a
 * budtender) could pull any dispensary's payroll data via direct URL.
 */
@Controller('payroll')
export class PayrollController {
  constructor(private readonly timeClock: TimeClockService) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('export')
  async exportCsv(
    @Query('dispensaryId') dispensaryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId || !startDate || !endDate) {
      res
        .status(400)
        .json({ error: 'dispensaryId, startDate, and endDate are required' });
      return;
    }
    if (user.role !== 'super_admin' && user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Cross-dispensary payroll access denied');
    }

    const csv = await this.timeClock.generatePayrollCsv(
      dispensaryId,
      startDate,
      endDate,
    );
    const filename = `payroll-${startDate}-to-${endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
