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
      location: {
        type: 'Point',
        coordinates: [createDto.longitude, createDto.latitude],
      },
    });

    const savedDispensary = await this.dispensaryRepository.save(dispensary);

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
    const radiusMeters = radiusMiles * 1609.34;

    const query = `
      SELECT * FROM dispensaries
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND is_active = true
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
    `;

    return this.dispensaryRepository.query(query, [
      longitude,
      latitude,
      radiusMeters,
    ]);
  }

  async update(
    id: string,
    updateDto: UpdateDispensaryDto,
  ): Promise<Dispensary> {
    const dispensary = await this.findOne(id);

    if (updateDto.latitude && updateDto.longitude) {
      updateDto['location'] = {
        type: 'Point',
        coordinates: [updateDto.longitude, updateDto.latitude],
      };
    }

    Object.assign(dispensary, updateDto);
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
