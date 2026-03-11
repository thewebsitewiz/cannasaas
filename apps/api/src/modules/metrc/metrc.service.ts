import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { CredentialValidationResult } from './dto/credential-validation-result.type';

const METRC_BASE_URLS: Record<string, string> = {
  NY: 'https://api-mn.metrc.com',
  NJ: 'https://api-nj.metrc.com',
  CT: 'https://api-ct.metrc.com',
};

@Injectable()
export class MetrcService {
  constructor(
    @InjectRepository(MetrcCredential)
    private credentialRepo: Repository<MetrcCredential>,
    private config: ConfigService,
  ) {}

  async upsertCredential(input: UpsertCredentialInput): Promise<MetrcCredential> {
    let credential = await this.credentialRepo.findOne({
      where: { dispensaryId: input.dispensaryId },
    });

    if (credential) {
      credential.userApiKey = input.userApiKey;
      if (input.integratorApiKey) credential.integratorApiKey = input.integratorApiKey;
      credential.state = input.state;
      if (input.metrcUsername) credential.metrcUsername = input.metrcUsername;
      credential.isActive = true;
      credential.validationError = null as any;
      credential.lastValidatedAt = null as any;
    } else {
      credential = this.credentialRepo.create({
        dispensaryId: input.dispensaryId,
        userApiKey: input.userApiKey,
        integratorApiKey: input.integratorApiKey,
        state: input.state,
        metrcUsername: input.metrcUsername,
        isActive: true,
      });
    }

    return this.credentialRepo.save(credential);
  }

  async getCredential(dispensaryId: string): Promise<MetrcCredential | null> {
    return this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
  }

  async validateCredential(dispensaryId: string): Promise<CredentialValidationResult> {
    const credential = await this.credentialRepo.findOne({ where: { dispensaryId } });
    if (!credential) throw new NotFoundException('No Metrc credential found for this dispensary');

    const baseUrl = METRC_BASE_URLS[credential.state];
    if (!baseUrl) {
      return { valid: false, message: `Unsupported state: ${credential.state}` };
    }

    const integratorKey = credential.integratorApiKey ||
      this.config.get<string>('metrc.integratorApiKey');

    if (!integratorKey) {
      return { valid: false, message: 'No integrator API key configured' };
    }

    // Basic auth: base64(userApiKey:integratorApiKey)
    const authToken = Buffer.from(`${credential.userApiKey}:${integratorKey}`).toString('base64');

    try {
      const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
      const url = isSandbox
        ? `https://sandbox-api-mn.metrc.com/facilities/v2`
        : `${baseUrl}/facilities/v2`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        await this.credentialRepo.update(credential.credentialId, {
          lastValidatedAt: new Date(),
          validationError: `HTTP ${response.status}: ${errorText.substring(0, 255)}`,
        });
        return { valid: false, message: `Metrc API error: HTTP ${response.status}` };
      }

      const facilities = await response.json() as any[];
      const facility = facilities?.[0];

      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: null as any,
      });

      return {
        valid: true,
        message: `Connected to Metrc ${credential.state} — ${facilities.length} facility(ies) found`,
        metrcFacilityName: facility?.Name,
        licenseNumber: facility?.License?.Number,
        licenseType: facility?.License?.LicenseType,
      };

    } catch (err: any) {
      const message = err?.message ?? 'Network error';
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: message.substring(0, 255),
      });
      return { valid: false, message };
    }
  }

  async deactivateCredential(dispensaryId: string): Promise<boolean> {
    const result = await this.credentialRepo.update(
      { dispensaryId },
      { isActive: false }
    );
    return (result.affected ?? 0) > 0;
  }

  async listCredentials(): Promise<MetrcCredential[]> {
    return this.credentialRepo.find({ order: { createdAt: 'DESC' } });
  }
}
