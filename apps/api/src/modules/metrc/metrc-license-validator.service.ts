import { Injectable, Logger } from '@nestjs/common';

export interface MetrcLicenseValidation {
  /** Whether the license passes format + state-rule checks. */
  readonly valid: boolean;
  /** Why the license failed (empty when valid). */
  readonly reason?: string;
  /** Inferred license type from the pattern (e.g. "MED", "RE", "AU"). */
  readonly licenseType?: string;
}

/**
 * State-specific license-number patterns (sc-685). All admit a 6-digit
 * trailing serial; the middle segment narrows the license type:
 *   NY-MED-######      medical dispensary
 *   NY-AU-######       adult-use
 *   NJ-RE-######       NJ recreational
 *   NJ-MED-######      NJ medical
 *   CT-MED-######      CT medical
 *
 * Anything outside these patterns is rejected for now. A future
 * follow-up can hit Metrc's facility API for live name + expiry
 * lookup — until then, format validation catches the common typo
 * mistakes and is good enough for vendor onboarding.
 */
const STATE_PATTERNS: Record<string, RegExp[]> = {
  NY: [/^NY-(MED|AU)-\d{6}$/i],
  NJ: [/^NJ-(RE|MED)-\d{6}$/i],
  CT: [/^CT-MED-\d{6}$/i],
};

@Injectable()
export class MetrcLicenseValidatorService {
  private readonly logger = new Logger(MetrcLicenseValidatorService.name);

  validate(licenseNumber: string, state: string): MetrcLicenseValidation {
    const trimmed = licenseNumber.trim().toUpperCase();
    const stateCode = state.trim().toUpperCase();
    if (!trimmed) {
      return { valid: false, reason: 'License number is required.' };
    }
    if (!stateCode) {
      return { valid: false, reason: 'State is required.' };
    }
    const patterns = STATE_PATTERNS[stateCode];
    if (!patterns) {
      return {
        valid: false,
        reason: `State "${stateCode}" is not supported for Metrc license validation yet.`,
      };
    }
    const match = patterns
      .map((p) => p.exec(trimmed))
      .find((m): m is RegExpExecArray => m !== null);
    if (!match) {
      return {
        valid: false,
        reason: `License "${trimmed}" does not match the expected ${stateCode} pattern.`,
      };
    }
    this.logger.log(
      `License ${trimmed} passes ${stateCode} format check (TODO: future Metrc facility lookup)`,
    );
    return {
      valid: true,
      licenseType: match[1]?.toUpperCase(),
    };
  }
}
