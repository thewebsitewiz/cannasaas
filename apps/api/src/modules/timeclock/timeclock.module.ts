import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeClockService } from './timeclock.service';
import { TimeClockResolver } from './timeclock.resolver';
import { PayrollController } from './payroll.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry])],
  providers: [TimeClockService, TimeClockResolver],
  controllers: [PayrollController],
  exports: [TimeClockService],
})
export class TimeClockModule {}
