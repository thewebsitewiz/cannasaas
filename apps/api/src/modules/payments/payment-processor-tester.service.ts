import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from './entities/dispensary-payment-processor.entity';
import {
  type AeropayCredentials,
  AeropayOnboardingService,
} from './onboarding/aeropay-onboarding.service';
import {
  type CanPayCredentials,
  CanPayOnboardingService,
} from './onboarding/canpay-onboarding.service';
import {
  AEROPAY_CREDENTIAL_VALIDATOR,
  CANPAY_CREDENTIAL_VALIDATOR,
  type ProcessorCredentialValidator,
} from './onboarding/processor-credential-validator';

export interface TestProcessorResult {
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

/**
 * "Test connection" entry-point for a provisioned dispensary processor.
 *
 * Reuses the same `ProcessorCredentialValidator` hook that onboarding
 * uses for pre-persist validation (sc-194 epic). On test, we:
 *
 *  1. Load decrypted credentials for the dispensary + processor.
 *  2. Re-run the validator's `validate({credentials, isSandbox})` round
 *     trip against the sandbox/prod adapter.
 *  3. Time it and surface `{ok, latencyMs, errorMessage}` to the admin.
 *
 * The validators are `@Optional()` because the adapter module can be
 * unloaded in dev environments (missing env config — see the boot-time
 * warnings on AeropayPaymentProcessor / CanPayPaymentProcessor). In
 * that mode this service returns `ok: false` with an explanatory
 * message instead of throwing — the admin UI is the right place to see
 * "adapter not loaded" rather than a 500.
 */
@Injectable()
export class PaymentProcessorTesterService {
  private readonly logger = new Logger(PaymentProcessorTesterService.name);

  constructor(
    @InjectRepository(DispensaryPaymentProcessor)
    private readonly repo: Repository<DispensaryPaymentProcessor>,
    private readonly aeropayOnboarding: AeropayOnboardingService,
    private readonly canpayOnboarding: CanPayOnboardingService,
    @Optional()
    @Inject(AEROPAY_CREDENTIAL_VALIDATOR)
    private readonly aeropayValidator: ProcessorCredentialValidator<AeropayCredentials> | null = null,
    @Optional()
    @Inject(CANPAY_CREDENTIAL_VALIDATOR)
    private readonly canpayValidator: ProcessorCredentialValidator<CanPayCredentials> | null = null,
  ) {}

  async test(
    dispensaryId: string,
    processorName: DispensaryProcessorName,
  ): Promise<TestProcessorResult> {
    const row = await this.repo.findOne({
      where: { dispensaryId, processorName },
    });
    if (!row) {
      throw new BadRequestException(
        `No ${processorName} config for dispensary — provision first.`,
      );
    }
    if (!row.isEnabled || !row.credentialsEncrypted) {
      return {
        ok: false,
        errorMessage:
          'Processor is not provisioned (missing credentials or disabled).',
      };
    }

    const start = Date.now();
    try {
      if (processorName === DispensaryProcessorName.AEROPAY) {
        const credentials =
          await this.aeropayOnboarding.getCredentials(dispensaryId);
        if (!credentials) {
          return {
            ok: false,
            errorMessage: 'Could not load stored credentials.',
          };
        }
        if (!this.aeropayValidator) {
          return {
            ok: false,
            errorMessage: 'Aeropay adapter is not loaded in this environment.',
          };
        }
        await this.aeropayValidator.validate({
          credentials,
          isSandbox: row.isSandbox,
        });
      } else if (processorName === DispensaryProcessorName.CANPAY) {
        const credentials =
          await this.canpayOnboarding.getCredentials(dispensaryId);
        if (!credentials) {
          return {
            ok: false,
            errorMessage: 'Could not load stored credentials.',
          };
        }
        if (!this.canpayValidator) {
          return {
            ok: false,
            errorMessage: 'CanPay adapter is not loaded in this environment.',
          };
        }
        await this.canpayValidator.validate({
          credentials,
          isSandbox: row.isSandbox,
        });
      }
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error.';
      this.logger.warn(
        `testProcessor failed for dispensary=${dispensaryId} processor=${processorName}: ${message}`,
      );
      return { ok: false, latencyMs, errorMessage: message };
    }
  }
}
