import { DutchieAdapter } from '../../src/modules/pos/adapters/dutchie.adapter';
import { TreezAdapter } from '../../src/modules/pos/adapters/treez.adapter';
import { PosProvider } from '../../src/modules/pos/interfaces/pos-provider.interface';

// Mock axios with interceptors
jest.mock('axios', () => {
  const mockInterceptor = { use: jest.fn() };
  const mockClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    interceptors: { request: mockInterceptor, response: mockInterceptor },
  };
  return { __esModule: true, default: { create: jest.fn(() => mockClient) } };
});

describe('POS Adapters', () => {
  describe('DutchieAdapter', () => {
    let adapter: DutchieAdapter;

    beforeEach(() => {
      adapter = new DutchieAdapter();
      adapter.initialize({
        apiKey: 'test-key',
        endpoint: 'https://dutchie.com/graphql',
        dispensaryExternalId: 'dutchie-disp-1',
      });
    });

    it('should implement PosProvider interface', () => {
      expect(adapter.providerName).toBe('dutchie');
      expect(typeof adapter.testConnection).toBe('function');
      expect(typeof adapter.fetchProducts).toBe('function');
      expect(typeof adapter.fetchInventory).toBe('function');
      expect(typeof adapter.updateInventory).toBe('function');
      expect(typeof adapter.pushOrder).toBe('function');
      expect(typeof adapter.updateOrderStatus).toBe('function');
    });

    it('should have correct provider name', () => {
      expect(adapter.providerName).toBe('dutchie');
    });
  });

  describe('TreezAdapter', () => {
    let adapter: TreezAdapter;

    beforeEach(() => {
      adapter = new TreezAdapter();
      adapter.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.treez.io/v2',
        clientId: 'test-client',
      });
    });

    it('should implement PosProvider interface', () => {
      expect(adapter.providerName).toBe('treez');
      expect(typeof adapter.testConnection).toBe('function');
      expect(typeof adapter.fetchProducts).toBe('function');
      expect(typeof adapter.fetchInventory).toBe('function');
      expect(typeof adapter.updateInventory).toBe('function');
      expect(typeof adapter.pushOrder).toBe('function');
      expect(typeof adapter.updateOrderStatus).toBe('function');
    });

    it('should have correct provider name', () => {
      expect(adapter.providerName).toBe('treez');
    });
  });

  describe('Adapter Factory Pattern', () => {
    it('should create different adapters for different providers', () => {
      const dutchie = new DutchieAdapter();
      const treez = new TreezAdapter();

      expect(dutchie.providerName).not.toBe(treez.providerName);
    });

    it('all adapters should have the same method signatures', () => {
      const dutchie = new DutchieAdapter();
      const treez = new TreezAdapter();

      const methods: (keyof PosProvider)[] = [
        'providerName', 'initialize', 'testConnection',
        'fetchProducts', 'fetchProductById',
        'fetchInventory', 'updateInventory',
        'pushOrder', 'updateOrderStatus',
      ];

      for (const method of methods) {
        expect(dutchie).toHaveProperty(method);
        expect(treez).toHaveProperty(method);
      }
    });
  });
});
