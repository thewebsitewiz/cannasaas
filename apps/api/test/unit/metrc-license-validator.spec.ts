/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { MetrcLicenseValidatorService } from '../../src/modules/metrc/metrc-license-validator.service';

describe('MetrcLicenseValidatorService (sc-685)', () => {
  let service: MetrcLicenseValidatorService;

  beforeEach(() => {
    service = new MetrcLicenseValidatorService();
  });

  it('rejects empty license', () => {
    const result = service.validate('', 'NY');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/required/i);
  });

  it('rejects empty state', () => {
    const result = service.validate('NY-MED-123456', '');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/state.*required/i);
  });

  it('rejects unsupported state', () => {
    const result = service.validate('CA-RE-123456', 'CA');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not supported/i);
  });

  it('accepts NY-MED-NNNNNN', () => {
    const result = service.validate('NY-MED-123456', 'NY');
    expect(result.valid).toBe(true);
    expect(result.licenseType).toBe('MED');
  });

  it('accepts NY-AU-NNNNNN', () => {
    const result = service.validate('NY-AU-654321', 'NY');
    expect(result.valid).toBe(true);
    expect(result.licenseType).toBe('AU');
  });

  it('accepts NJ-RE-NNNNNN and NJ-MED-NNNNNN', () => {
    expect(service.validate('NJ-RE-111111', 'NJ').valid).toBe(true);
    expect(service.validate('NJ-MED-222222', 'NJ').valid).toBe(true);
  });

  it('accepts CT-MED-NNNNNN', () => {
    expect(service.validate('CT-MED-333333', 'CT').valid).toBe(true);
  });

  it('rejects malformed input + reports the state in the reason', () => {
    const result = service.validate('garbage', 'NY');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/NY/);
  });

  it('is case-insensitive on both inputs', () => {
    const result = service.validate(' ny-med-123456 ', ' ny ');
    expect(result.valid).toBe(true);
    expect(result.licenseType).toBe('MED');
  });
});
