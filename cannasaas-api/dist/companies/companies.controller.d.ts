import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    create(createDto: CreateCompanyDto): Promise<import("./entities/company.entity").Company>;
    findAll(organizationId?: string): Promise<import("./entities/company.entity").Company[]>;
    findOne(id: string): Promise<import("./entities/company.entity").Company>;
    update(id: string, updateDto: UpdateCompanyDto): Promise<import("./entities/company.entity").Company>;
    remove(id: string): Promise<void>;
}
