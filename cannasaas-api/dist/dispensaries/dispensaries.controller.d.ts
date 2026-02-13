import { DispensariesService } from './dispensaries.service';
import { UploadService } from '../upload/upload.service';
import { CreateDispensaryDto } from './dto/create-dispensary.dto';
import { UpdateDispensaryDto } from './dto/update-dispensary.dto';
export declare class DispensariesController {
    private dispensariesService;
    private uploadService;
    constructor(dispensariesService: DispensariesService, uploadService: UploadService);
    create(createDto: CreateDispensaryDto): Promise<import("./entities/dispensary.entity").Dispensary>;
    findAll(companyId?: string): Promise<import("./entities/dispensary.entity").Dispensary[]>;
    findNearby(latitude: number, longitude: number, radius?: number): Promise<import("./entities/dispensary.entity").Dispensary[]>;
    findOne(id: string): Promise<import("./entities/dispensary.entity").Dispensary>;
    update(id: string, updateDto: UpdateDispensaryDto): Promise<import("./entities/dispensary.entity").Dispensary>;
    remove(id: string): Promise<void>;
    uploadLogo(id: string, file: Express.Multer.File): Promise<import("./entities/branding-config.entity").BrandingConfig>;
    updateBranding(id: string, updateDto: any): Promise<import("./entities/branding-config.entity").BrandingConfig>;
}
