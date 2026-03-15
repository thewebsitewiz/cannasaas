import { getApp, closeApp, getAdminToken, gql, DISP } from './test-helper';

let token: string;
beforeAll(async () => { await getApp(); token = await getAdminToken(); }, 30000);
afterAll(async () => { await closeApp(); });

describe('Orders E2E', () => {
  it('lists orders', async () => {
    const res = await gql(token, `{ orders(dispensaryId: "${DISP}") { orderId orderStatus total } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders).toBeDefined();
  });

  it('gets single order', async () => {
    const list = await gql(token, `{ orders(dispensaryId: "${DISP}") { orderId } }`);
    if (list.body.data?.orders?.length > 0) {
      const id = list.body.data.orders[0].orderId;
      const res = await gql(token, `{ order(orderId: "${id}") { orderId orderStatus total } }`);
      expect(res.status).toBe(200);
      expect(res.body.data.order.orderId).toBe(id);
    }
  });

  it('salesOverview works', async () => {
    const res = await gql(token, `{ salesOverview(dispensaryId: "${DISP}") { totalRevenue totalOrders } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.salesOverview).toBeDefined();
  });
});
