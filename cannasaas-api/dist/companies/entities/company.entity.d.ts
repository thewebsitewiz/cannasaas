import { Organization } from '../../organizations/entities/organization.entity';
import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
export declare class Company {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    organization: Organization;
    dispensaries: Dispensary[];
    createdAt: Date;
    updatedAt: Date;
}
