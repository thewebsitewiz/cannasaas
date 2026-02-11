import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesService {
    private companyRepository;
    constructor(companyRepository: Repository<Company>);
    create(createDto: CreateCompanyDto): Promise<Company>;
    findAll(organizationId?: string): Promise<Company[]>;
    findOne(id: string): Promise<Company>;
    findBySlug(slug: string): Promise<Company>;
    update(id: string, updateDto: UpdateCompanyDto): Promise<Company>;
    remove(id: string): Promise<void>;
}
