/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { buildAuditCsv } from '../../src/modules/inventory/inventory-audit.controller';

describe('buildAuditCsv (sc-689)', () => {
  const meta = {
    dispensaryName: 'Acme Dispensary',
    since: '2026-05-01',
    until: '2026-05-22',
  };

  const baseRow = {
    transactionId: 't-1',
    createdAt: '2026-05-12T14:30:00.000Z',
    transactionType: 'sale',
    productName: 'Blue Dream',
    variantName: '3.5g',
    quantityDelta: -2,
    quantityBefore: 10,
    quantityAfter: 8,
    performedByEmail: 'budtender@disp.test',
    referenceOrderId: 'o-123',
    notes: null,
  };

  it('emits a meta header with name + range + generated stamp', () => {
    const csv = buildAuditCsv([baseRow], meta);
    expect(csv).toContain('"Inventory Audit Log: Acme Dispensary"');
    expect(csv).toContain('"Range: 2026-05-01 to 2026-05-22"');
    expect(csv).toContain('"Generated:');
  });

  it('emits a column header row', () => {
    const csv = buildAuditCsv([baseRow], meta);
    expect(csv).toContain(
      'Timestamp,Type,Product,Variant,Quantity Delta,Quantity Before,Quantity After,Performed By,Reference Order,Notes',
    );
  });

  it('emits one data row per transaction with all columns quoted', () => {
    const csv = buildAuditCsv([baseRow], meta);
    expect(csv).toContain(
      '"2026-05-12T14:30:00.000Z","sale","Blue Dream","3.5g","-2","10","8","budtender@disp.test","o-123",""',
    );
  });

  it('escapes embedded double-quotes by doubling them', () => {
    const csv = buildAuditCsv(
      [{ ...baseRow, notes: 'Customer said "thanks"' }],
      meta,
    );
    expect(csv).toContain('"Customer said ""thanks"""');
  });

  it('falls back to empty string for null product / variant / email', () => {
    const csv = buildAuditCsv(
      [
        {
          ...baseRow,
          productName: null,
          variantName: null,
          performedByEmail: null,
          referenceOrderId: null,
        },
      ],
      meta,
    );
    // Five consecutive empty quoted columns
    expect(csv).toContain('"sale","","","-2","10","8","",""');
  });

  it('accepts Date instances and string timestamps', () => {
    const csv = buildAuditCsv(
      [{ ...baseRow, createdAt: new Date('2026-05-12T14:30:00.000Z') }],
      meta,
    );
    expect(csv).toContain('"2026-05-12T14:30:00.000Z"');
  });

  it('keeps multiple rows in input order', () => {
    const csv = buildAuditCsv(
      [
        { ...baseRow, transactionId: 'a', productName: 'First' },
        { ...baseRow, transactionId: 'b', productName: 'Second' },
      ],
      meta,
    );
    expect(csv.indexOf('First')).toBeLessThan(csv.indexOf('Second'));
  });
});
