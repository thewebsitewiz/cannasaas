import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(createDto);
    const savedCompany = await this.companyRepository.save(company);
    return this.findOne(savedCompany.id);
  }

  async findAll(organizationId?: string): Promise<Company[]> {
    const where = organizationId ? { organizationId } : {};
    return this.companyRepository.find({
      where,
      relations: ['organization', 'dispensaries'],
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['organization', 'dispensaries'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async findBySlug(slug: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { slug },
      relations: ['organization', 'dispensaries'],
    });

    if (!company) {
      throw new NotFoundException(`Company with slug "${slug}" not found`);
    }

    return company;
  }

  async update(id: string, updateDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, updateDto);
    await this.companyRepository.save(company);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
  }
}
