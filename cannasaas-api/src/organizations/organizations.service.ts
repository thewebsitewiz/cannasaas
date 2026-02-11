import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async create(createDto: CreateOrganizationDto): Promise<Organization> {
    const org = this.orgRepository.create(createDto);
    return this.orgRepository.save(org);
  }

  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find({ relations: ['companies'] });
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ['companies'],
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const org = await this.findOne(id);
    Object.assign(org, updateDto);
    await this.orgRepository.save(org);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    await this.orgRepository.remove(org);
  }
}
