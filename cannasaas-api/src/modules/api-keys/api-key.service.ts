// cannasaas-api/src/modules/api-keys/api-key.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(@InjectRepository(ApiKey) private keyRepo: Repository<ApiKey>) {}

  async createKey(orgId: string, name: string, permissions: string[]) {
    const rawKey = `cs_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.keyRepo.create({
      organizationId: orgId, name, hashedKey, permissions,
      prefix: rawKey.slice(0, 10),
    });
    await this.keyRepo.save(apiKey);
    return { key: rawKey, id: apiKey.id, name, permissions };
  }

  async validateKey(rawKey: string) {
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.keyRepo.findOne({
      where: { hashedKey, active: true },
    });
    if (!apiKey) throw new UnauthorizedException('Invalid API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date())
      throw new UnauthorizedException('API key expired');

    apiKey.lastUsedAt = new Date();
    apiKey.requestCount++;
    await this.keyRepo.save(apiKey);
    return apiKey;
  }

  async revokeKey(keyId: string, orgId: string) {
    await this.keyRepo.update(
      { id: keyId, organizationId: orgId },
      { active: false, revokedAt: new Date() });
  }
}
