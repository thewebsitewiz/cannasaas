import { Repository } from 'typeorm';
import { Dispensary } from './entities/dispensary.entity';
import { BrandingConfig } from './entities/branding-config.entity';
import { CreateDispensaryDto } from './dto/create-dispensary.dto';
import { UpdateDispensaryDto } from './dto/update-dispensary.dto';
export declare class DispensariesService {
    private dispensaryRepository;
    private brandingRepository;
    constructor(dispensaryRepository: Repository<Dispensary>, brandingRepository: Repository<BrandingConfig>);
    create(createDto: CreateDispensaryDto): Promise<Dispensary>;
    findAll(companyId?: string): Promise<Dispensary[]>;
    findOne(id: string): Promise<Dispensary>;
    findNearby(latitude: number, longitude: number, radiusMiles?: number): Promise<Dispensary[]>;
    update(id: string, updateDto: UpdateDispensaryDto): Promise<Dispensary>;
    remove(id: string): Promise<void>;
    updateBranding(dispensaryId: string, updateDto: Partial<BrandingConfig>): Promise<BrandingConfig>;
}
