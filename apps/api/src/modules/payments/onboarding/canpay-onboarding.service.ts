import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from '../entities/dispensary-payment-processor.entity';
import { CredentialEncryptionService } from '../security/credential-encryption.service';
import {
  CANPAY_CREDENTIAL_VALIDATOR,
  ProcessorCredentialValidationError,
  ProcessorCredentialValidator,
} from './processor-credential-validator';

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
    @Optional()
    @Inject(CANPAY_CREDENTIAL_VALIDATOR)
    private readonly validator: ProcessorCredentialValidator<CanPayCredentials> | null = null,
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
    await this.validateOrWarn(credentials, input.isSandbox ?? true);

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

  private async validateOrWarn(
    credentials: CanPayCredentials,
    isSandbox: boolean,
  ): Promise<void> {
    if (!this.validator) {
      this.logger.warn(
        `No CANPAY_CREDENTIAL_VALIDATOR registered — provisioning credentials unvalidated. ` +
          `Wire the CanPayPaymentProcessor as a validator once sc-215 lands on main.`,
      );
      return;
    }
    try {
      await this.validator.validate({ credentials, isSandbox });
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      throw new ProcessorCredentialValidationError('CanPay', detail);
    }
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
