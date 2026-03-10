import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispensary } from '../dispensaries/entities/dispensary.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Dispensary) private dispensaries: Repository<Dispensary>,
  ) {}

  async resolveBySlug(slug: string) {
    return this.dispensaries.findOne({ where: { slug, is_active: true } });
  }
}
