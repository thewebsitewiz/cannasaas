import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(createDto: CreateOrganizationDto): Promise<import("./entities/organization.entity").Organization>;
    findAll(): Promise<{}>;
    findOne(id: string): Promise<import("./entities/organization.entity").Organization>;
    update(id: string, updateDto: UpdateOrganizationDto): Promise<import("./entities/organization.entity").Organization>;
    remove(id: string): Promise<void>;
}
