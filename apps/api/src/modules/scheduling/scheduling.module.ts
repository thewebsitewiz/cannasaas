import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledShift, ShiftTemplate, ShiftSwapRequest, TimeOffRequest, DriverProfile, DeliveryTrip } from './entities/scheduling.entity';
import { SchedulingService } from './scheduling.service';
import { SchedulingResolver } from './scheduling.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledShift, ShiftTemplate, ShiftSwapRequest, TimeOffRequest, DriverProfile, DeliveryTrip])],
  providers: [SchedulingService, SchedulingResolver],
  exports: [SchedulingService],
})
export class SchedulingModule {}
