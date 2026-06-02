import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

import { OrderGateway } from './order.gateway';

interface RecordedEmit {
  room: string;
  event: string;
  payload: unknown;
}

function makeServer(recorded: RecordedEmit[]): Server {
  return {
    to(room: string) {
      return {
        emit(event: string, payload: unknown) {
          recorded.push({ room, event, payload });
          return true;
        },
      };
    },
  } as unknown as Server;
}

function makeStorefrontSocket(
  dispensaryId: string,
  joined: string[],
  emits: { event: string; payload: unknown }[],
): Socket {
  const id = 'sock-' + Math.random().toString(36).slice(2, 8);
  return {
    id,
    handshake: {
      auth: { storefrontDispensaryId: dispensaryId },
      headers: {},
    },
    join: (room: string) => {
      joined.push(room);
    },
    emit: (event: string, payload: unknown) => {
      emits.push({ event, payload });
    },
    disconnect: () => undefined,
  } as unknown as Socket;
}

function makeTokenlessSocket(): Socket {
  let disconnected = false;
  return {
    id: 'sock-bad',
    handshake: { auth: {}, headers: {} },
    join: () => undefined,
    emit: () => undefined,
    disconnect: () => {
      disconnected = true;
    },
    get __disconnected(): boolean {
      return disconnected;
    },
  } as unknown as Socket;
}

describe('OrderGateway', () => {
  let gateway: OrderGateway;
  let recorded: RecordedEmit[];

  beforeEach(async () => {
    recorded = [];
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrderGateway,
        {
          provide: JwtService,
          useValue: { verify: jest.fn() } as unknown as JwtService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() } as unknown as ConfigService,
        },
      ],
    }).compile();
    gateway = moduleRef.get(OrderGateway);
    (gateway as unknown as { server: Server }).server = makeServer(recorded);
  });

  describe('handleConnection — storefront anonymous flow', () => {
    it('joins storefront:{dispensaryId} room when storefrontDispensaryId is present and no token', () => {
      const joined: string[] = [];
      const emits: { event: string; payload: unknown }[] = [];
      const sock = makeStorefrontSocket('d-1', joined, emits);
      gateway.handleConnection(sock);
      expect(joined).toEqual(['storefront:d-1']);
      expect(emits[0]?.event).toBe('connected');
      expect(emits[0]?.payload).toMatchObject({
        anonymous: true,
        rooms: ['storefront:d-1'],
      });
    });

    it('disconnects when neither token nor storefrontDispensaryId is present', () => {
      const sock = makeTokenlessSocket();
      gateway.handleConnection(sock);
      expect(
        (sock as unknown as { __disconnected: boolean }).__disconnected,
      ).toBe(true);
    });
  });

  describe('handleStockChanged', () => {
    it('broadcasts the public stock projection to storefront:{dispensaryId}', () => {
      gateway.handleStockChanged({
        dispensaryId: 'd-1',
        inventoryId: 'i-1',
        variantId: 'v-1',
        productName: 'Blue Dream 1g',
        previousAvailable: 10,
        newAvailable: 9,
        reorderThreshold: 3,
        status: 'in_stock',
        source: 'reserve',
      });
      expect(recorded).toHaveLength(1);
      expect(recorded[0].room).toBe('storefront:d-1');
      expect(recorded[0].event).toBe('stock:changed');
      expect(recorded[0].payload).toMatchObject({
        variantId: 'v-1',
        available: 9,
        status: 'in_stock',
      });
    });

    it('does NOT leak productName or threshold to storefront customers', () => {
      gateway.handleStockChanged({
        dispensaryId: 'd-1',
        inventoryId: 'i-1',
        variantId: 'v-1',
        productName: 'Secret Sauce',
        previousAvailable: 5,
        newAvailable: 0,
        reorderThreshold: 3,
        status: 'out_of_stock',
        source: 'reserve',
      });
      expect(recorded[0].payload).not.toHaveProperty('productName');
      expect(recorded[0].payload).not.toHaveProperty('reorderThreshold');
    });
  });

  describe('handleOutOfStock', () => {
    it('broadcasts to staff:{dispensaryId} only, never storefront', () => {
      gateway.handleOutOfStock({
        dispensaryId: 'd-1',
        productName: 'Blue Dream 1g',
        quantity: 0,
      });
      expect(recorded).toHaveLength(1);
      expect(recorded[0].room).toBe('staff:d-1');
      expect(recorded[0].event).toBe('inventory:alert');
      expect(recorded[0].payload).toMatchObject({ type: 'out_of_stock' });
    });
  });

  describe('handleLowStock', () => {
    it('broadcasts to staff:{dispensaryId} only', () => {
      gateway.handleLowStock({
        dispensaryId: 'd-1',
        productName: 'Blue Dream 1g',
        quantity: 3,
      });
      expect(recorded).toHaveLength(1);
      expect(recorded[0].room).toBe('staff:d-1');
      expect(recorded[0].event).toBe('inventory:alert');
      expect(recorded[0].payload).toMatchObject({ type: 'low_stock' });
    });
  });

  // ── TC-ORDER-003 (sc-576) — WS broadcasts on every transition ─────────────

  describe('handleOrderCompleted', () => {
    it('TC-ORDER-003 — broadcasts to user: (order:update) and staff: (order:new)', () => {
      gateway.handleOrderCompleted({
        orderId: 'o-1',
        dispensaryId: 'd-1',
        customerUserId: 'u-1',
        total: 54,
        orderType: 'in_store',
      });
      const rooms = recorded.map((r) => r.room);
      expect(rooms).toContain('user:u-1');
      expect(rooms).toContain('staff:d-1');

      const userBroadcast = recorded.find((r) => r.room === 'user:u-1');
      expect(userBroadcast?.event).toBe('order:update');
      const staffBroadcast = recorded.find((r) => r.room === 'staff:d-1');
      expect(staffBroadcast?.event).toBe('order:new');

      // Every payload tagged with status='confirmed' (initial transition).
      for (const r of recorded) {
        expect(r.payload).toMatchObject({
          type: 'order.confirmed',
          status: 'confirmed',
          orderId: 'o-1',
        });
      }
    });

    it('TC-ORDER-003 — anonymous order (no customerUserId) still broadcasts to staff only', () => {
      gateway.handleOrderCompleted({
        orderId: 'o-anon',
        dispensaryId: 'd-1',
      });
      const rooms = recorded.map((r) => r.room);
      expect(rooms).toContain('staff:d-1');
      expect(rooms.some((r) => r.startsWith('user:'))).toBe(false);
    });
  });

  describe('handleOrderStatusChanged', () => {
    it('TC-ORDER-003 — every status transition emits order:update to order + user + staff', () => {
      gateway.handleOrderStatusChanged({
        orderId: 'o-2',
        dispensaryId: 'd-1',
        customerUserId: 'u-2',
        status: 'ready_for_pickup',
      });
      const rooms = recorded.map((r) => r.room);
      expect(rooms).toContain('order:o-2');
      expect(rooms).toContain('user:u-2');
      expect(rooms).toContain('staff:d-1');
      for (const r of recorded) {
        expect(r.event).toBe('order:update');
        expect(r.payload).toMatchObject({
          type: 'order.status_changed',
          status: 'ready_for_pickup',
        });
      }
    });

    it('TC-ORDER-003 — every payload carries an ISO timestamp', () => {
      gateway.handleOrderStatusChanged({
        orderId: 'o-3',
        dispensaryId: 'd-1',
        customerUserId: 'u-3',
        status: 'cancelled',
      });
      for (const r of recorded) {
        const p = r.payload as { timestamp?: string };
        expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });

    it('TC-ORDER-003 — anonymous status transition still hits order: + staff:', () => {
      gateway.handleOrderStatusChanged({
        orderId: 'o-anon',
        dispensaryId: 'd-1',
        status: 'cancelled',
      });
      const rooms = recorded.map((r) => r.room);
      expect(rooms).toContain('order:o-anon');
      expect(rooms).toContain('staff:d-1');
      expect(rooms.some((r) => r.startsWith('user:'))).toBe(false);
    });
  });
});
