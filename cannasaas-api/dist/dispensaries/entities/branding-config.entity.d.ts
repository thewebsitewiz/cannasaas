import { Dispensary } from './dispensary.entity';
export declare class BrandingConfig {
    id: string;
    dispensaryId: string;
    logoUrl: string;
    logoDarkUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    customCss: string;
    dispensary: Dispensary;
    createdAt: Date;
    updatedAt: Date;
}
