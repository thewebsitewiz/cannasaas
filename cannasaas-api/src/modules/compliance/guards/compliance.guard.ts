// cannasaas-api/src/modules/compliance/guards/compliance.guard.ts
import { Injectable, CanActivate, ExecutionContext,
  ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Organization } from '../../organizations/organization.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ComplianceGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const orgId = request.user?.organizationId;

    const [org, user] = await Promise.all([
      this.orgRepo.findOneOrFail({ where: { id: orgId } }),
      this.userRepo.findOneOrFail({ where: { id: userId } }),
    ]);

    // Age verification
    if (org.complianceConfig?.ageVerificationRequired) {
      if (!user.dateOfBirth)
        throw new ForbiddenException('Date of birth required');

      const age = this.calculateAge(user.dateOfBirth);
      const minAge = org.complianceConfig.medicalOnly ? 18 : 21;
      if (age < minAge)
        throw new ForbiddenException(`Must be ${minAge}+ to purchase`);

      if (org.complianceConfig.requireIdScan && user.idVerifiedAt) {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
        if (user.idVerifiedAt < ninetyDaysAgo)
          throw new ForbiddenException('ID verification expired');
      }
    }

    // Daily purchase limit
    if (org.complianceConfig?.dailyPurchaseLimit) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todaysOrders = await this.orderRepo.find({
        where: { customerId: userId, organizationId: orgId,
          createdAt: MoreThan(today), status: 'completed' },
      });
      const todaysTotal = todaysOrders.reduce(
        (s, o) => s + Number(o.totalWeight || 0), 0);

      if (todaysTotal >= org.complianceConfig.dailyPurchaseLimit)
        throw new ForbiddenException(
          `Daily limit (${org.complianceConfig.dailyPurchaseLimit}g) reached`);
    }

    return true;
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
}
