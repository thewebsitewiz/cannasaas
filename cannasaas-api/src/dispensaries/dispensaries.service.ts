import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispensary } from './entities/dispensary.entity';
import { BrandingConfig } from './entities/branding-config.entity';
import { CreateDispensaryDto } from './dto/create-dispensary.dto';
import { UpdateDispensaryDto } from './dto/update-dispensary.dto';

@Injectable()
export class DispensariesService {
  constructor(
    @InjectRepository(Dispensary)
    private dispensaryRepository: Repository<Dispensary>,
    @InjectRepository(BrandingConfig)
    private brandingRepository: Repository<BrandingConfig>,
  ) {}

  async create(createDto: CreateDispensaryDto): Promise<Dispensary> {
    const dispensary = this.dispensaryRepository.create({
      ...createDto,
    });

    const savedDispensary: any = await this.dispensaryRepository.save(dispensary);

    // Create default branding config
    const branding = this.brandingRepository.create({
      dispensaryId: savedDispensary.id,
    });
    await this.brandingRepository.save(branding);

    return this.findOne(savedDispensary.id);
  }

  async findAll(companyId?: string): Promise<Dispensary[]> {
    const where = companyId ? { companyId } : {};
    return this.dispensaryRepository.find({
      where,
      relations: ['branding', 'company'],
    });
  }

  async findOne(id: string): Promise<Dispensary> {
    const dispensary = await this.dispensaryRepository.findOne({
      where: { id },
      relations: ['branding', 'company'],
    });

    if (!dispensary) {
      throw new NotFoundException(`Dispensary with ID ${id} not found`);
    }

    return dispensary;
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusMiles: number = 10,
  ): Promise<Dispensary[]> {
    // Convert miles to meters (1 mile = 1609.34 meters)


    const query = `
      SELECT *, (
        3959 * acos(
          cos(radians($2)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($1)) +
          sin(radians($2)) * sin(radians(latitude))
        )
      ) AS distance
      FROM dispensaries
      WHERE is_active = true
      HAVING distance < $3
      ORDER BY distance
    `;
    return this.dispensaryRepository.query(query, [
      longitude,
      latitude,
      radiusMiles,
    ]);
  }

  async update(
    id: string,
    updateDto: UpdateDispensaryDto,
  ): Promise<Dispensary> {
    const dispensary = await this.findOne(id);

    const updateData: any = { ...updateDto };
    if (updateDto.latitude && updateDto.longitude) {
    }

    Object.assign(dispensary, updateData);
    await this.dispensaryRepository.save(dispensary);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const dispensary = await this.findOne(id);
    await this.dispensaryRepository.remove(dispensary);
  }

  async updateBranding(
    dispensaryId: string,
    updateDto: Partial<BrandingConfig>,
  ): Promise<BrandingConfig> {
    const dispensary = await this.findOne(dispensaryId);

    if (!dispensary.branding) {
      const branding = this.brandingRepository.create({
        dispensaryId,
        ...updateDto,
      });
      return this.brandingRepository.save(branding);
    }

    Object.assign(dispensary.branding, updateDto);
    return this.brandingRepository.save(dispensary.branding);
  }
}
