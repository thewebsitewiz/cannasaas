import { BadRequestException } from '@nestjs/common';

/**
 * Adapter-side hook called from the onboarding flow before credentials
 * are encrypted + persisted. If implemented (sc-212 wires Aeropay,
 * sc-215 wires CanPay), the adapter pings its sandbox/production
 * endpoint with the provided credentials — a 401 or other auth-level
 * error throws here and the onboarding service refuses to persist.
 *
 * The hook is intentionally optional. When the adapter side hasn't
 * landed (e.g. PR queue with onboarding merged but the adapter still in
 * review), provisioning still works — credentials are stored
 * unvalidated, with a logged warning. A follow-up flips the warning to
 * a hard failure once adapters are universally available.
 */
export interface ProcessorCredentialValidator<TCredentials> {
  validate(args: {
    readonly credentials: TCredentials;
    readonly isSandbox: boolean;
  }): Promise<void>;
}

/**
 * Thrown when the adapter rejects credentials. Distinct from the
 * generic 400 so the resolver can surface a meaningful message
 * ("Your Aeropay merchant id or API key was rejected by the
 * sandbox — please verify").
 */
export class ProcessorCredentialValidationError extends BadRequestException {
  constructor(processor: string, detail: string) {
    super(`${processor} rejected the supplied credentials: ${detail}`);
  }
}

/**
 * DI tokens. The onboarding services optionally `@Optional() @Inject()`
 * these — when the adapter module isn't loaded (e.g., env config
 * missing), the inject resolves to undefined and validation is
 * skipped.
 */
export const AEROPAY_CREDENTIAL_VALIDATOR = Symbol(
  'AEROPAY_CREDENTIAL_VALIDATOR',
);
export const CANPAY_CREDENTIAL_VALIDATOR = Symbol(
  'CANPAY_CREDENTIAL_VALIDATOR',
);
