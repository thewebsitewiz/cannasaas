import { Point } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { BrandingConfig } from './branding-config.entity';
export interface OperatingHours {
    monday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    tuesday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    wednesday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    thursday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    friday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    saturday: {
        open: string;
        close: string;
        closed?: boolean;
    };
    sunday: {
        open: string;
        close: string;
        closed?: boolean;
    };
}
export declare class Dispensary {
    id: string;
    companyId: string;
    name: string;
    slug: string;
    description: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    location: Point;
    latitude: number;
    longitude: number;
    phoneNumber: string;
    email: string;
    website: string;
    operatingHours: OperatingHours;
    isActive: boolean;
    company: Company;
    branding: BrandingConfig;
    createdAt: Date;
    updatedAt: Date;
}
