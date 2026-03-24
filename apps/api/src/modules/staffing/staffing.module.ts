import { Module } from '@nestjs/common';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { EmployeeCertification } from './entities/employee-certification.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { LkpPosition, LkpCertificationType } from './entities/staffing-lookups.entity';
import { StaffingService } from './staffing.service';
import { StaffingResolver } from './staffing.resolver';

@Module({
  providers: [StaffingService, StaffingResolver],
  exports: [StaffingService],
})
export class StaffingModule {}
