import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/organization.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
export declare class ComplianceGuard implements CanActivate {
    private orgRepo;
    private orderRepo;
    private userRepo;
    constructor(orgRepo: Repository<Organization>, orderRepo: Repository<Order>, userRepo: Repository<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private calculateAge;
}
