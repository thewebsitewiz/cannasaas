import { Company } from '../../companies/entities/company.entity';
export declare class Organization {
    id: string;
    name: string;
    subdomain: string;
    description: string;
    isActive: boolean;
    companies: Company[];
    createdAt: Date;
    updatedAt: Date;
}
