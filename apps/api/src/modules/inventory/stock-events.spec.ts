import { computeStockStatus } from './stock-events';

describe('computeStockStatus', () => {
  it('returns "out_of_stock" when available is zero', () => {
    expect(computeStockStatus(0, 5)).toBe('out_of_stock');
    expect(computeStockStatus(0, null)).toBe('out_of_stock');
  });

  it('returns "out_of_stock" when available is negative (defensive)', () => {
    expect(computeStockStatus(-1, 5)).toBe('out_of_stock');
  });

  it('returns "low_stock" when available is at or below threshold', () => {
    expect(computeStockStatus(5, 5)).toBe('low_stock');
    expect(computeStockStatus(3, 5)).toBe('low_stock');
    expect(computeStockStatus(1, 5)).toBe('low_stock');
  });

  it('returns "in_stock" when above threshold', () => {
    expect(computeStockStatus(6, 5)).toBe('in_stock');
    expect(computeStockStatus(100, 5)).toBe('in_stock');
  });

  it('returns "in_stock" when no threshold is set and there is stock', () => {
    expect(computeStockStatus(10, null)).toBe('in_stock');
    expect(computeStockStatus(1, null)).toBe('in_stock');
  });
});
