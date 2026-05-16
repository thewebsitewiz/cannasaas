import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from '../entities/dispensary-payment-processor.entity';
import { CredentialEncryptionService } from '../security/credential-encryption.service';

export interface CanPayProvisionInput {
  readonly dispensaryId: string;
  readonly merchantId: string;
  readonly apiKey: string;
  readonly isSandbox?: boolean;
}

export interface CanPayCredentials {
  readonly merchantId: string;
  readonly apiKey: string;
}

@Injectable()
export class CanPayOnboardingService {
  private readonly logger = new Logger(CanPayOnboardingService.name);

  constructor(
    @InjectRepository(DispensaryPaymentProcessor)
    private readonly repo: Repository<DispensaryPaymentProcessor>,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  async provision(
    input: CanPayProvisionInput,
  ): Promise<DispensaryPaymentProcessor> {
    if (!input.merchantId.trim()) {
      throw new BadRequestException('merchantId is required');
    }
    if (!input.apiKey.trim()) {
      throw new BadRequestException('apiKey is required');
    }

    const credentials: CanPayCredentials = {
      merchantId: input.merchantId.trim(),
      apiKey: input.apiKey.trim(),
    };
    const encrypted = this.encryption.encrypt(JSON.stringify(credentials));
    const now = new Date();

    const existing = await this.repo.findOne({
      where: {
        dispensaryId: input.dispensaryId,
        processorName: DispensaryProcessorName.CANPAY,
      },
    });

    if (existing) {
      existing.credentialsEncrypted = encrypted;
      existing.merchantExternalId = credentials.merchantId;
      existing.isEnabled = true;
      if (input.isSandbox !== undefined) existing.isSandbox = input.isSandbox;
      existing.provisionedAt = now;
      const saved = await this.repo.save(existing);
      this.logger.log(
        `Re-provisioned CanPay for dispensary=${input.dispensaryId} merchant=${credentials.merchantId}`,
      );
      return saved;
    }

    const created = this.repo.create({
      dispensaryId: input.dispensaryId,
      processorName: DispensaryProcessorName.CANPAY,
      isEnabled: true,
      isSandbox: input.isSandbox ?? true,
      credentialsEncrypted: encrypted,
      merchantExternalId: credentials.merchantId,
      provisionedAt: now,
    });
    const saved = await this.repo.save(created);
    this.logger.log(
      `Provisioned CanPay for dispensary=${input.dispensaryId} merchant=${credentials.merchantId}`,
    );
    return saved;
  }

  async deprovision(
    dispensaryId: string,
  ): Promise<DispensaryPaymentProcessor | null> {
    const existing = await this.repo.findOne({
      where: {
        dispensaryId,
        processorName: DispensaryProcessorName.CANPAY,
      },
    });
    if (!existing) return null;

    existing.isEnabled = false;
    existing.credentialsEncrypted = undefined;
    existing.provisionedAt = undefined;
    const saved = await this.repo.save(existing);
    this.logger.log(
      `Deprovisioned CanPay for dispensary=${dispensaryId} (kept config row, cleared secrets)`,
    );
    return saved;
  }

  /**
   * Internal: returns decrypted credentials for the dispensary's CanPay
   * configuration. Used by the CanPay adapter once sc-215 and sc-217 are
   * both merged — the adapter currently reads env-level credentials.
   */
  async getCredentials(
    dispensaryId: string,
  ): Promise<CanPayCredentials | null> {
    const row = await this.repo.findOne({
      where: {
        dispensaryId,
        processorName: DispensaryProcessorName.CANPAY,
      },
    });
    if (!row || !row.isEnabled || !row.credentialsEncrypted) return null;
    const plaintext = this.encryption.decrypt(row.credentialsEncrypted);
    const parsed = JSON.parse(plaintext) as CanPayCredentials;
    return parsed;
  }
}
