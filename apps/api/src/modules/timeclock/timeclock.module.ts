import { Module } from '@nestjs/common';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeClockService } from './timeclock.service';
import { TimeClockResolver } from './timeclock.resolver';
import { PayrollController } from './payroll.controller';

@Module({
  providers: [TimeClockService, TimeClockResolver],
  controllers: [PayrollController],
  exports: [TimeClockService],
})
export class TimeClockModule {}
