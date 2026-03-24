import { Module } from '@nestjs/common';
import { ScheduledShift, ShiftTemplate, ShiftSwapRequest, TimeOffRequest, DriverProfile, DeliveryTrip } from './entities/scheduling.entity';
import { SchedulingService } from './scheduling.service';
import { SchedulingResolver } from './scheduling.resolver';

@Module({
  providers: [SchedulingService, SchedulingResolver],
  exports: [SchedulingService],
})
export class SchedulingModule {}
