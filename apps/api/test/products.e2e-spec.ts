import { getApp, closeApp, getAdminToken, gql, DISP } from './test-helper';

let token: string;
beforeAll(async () => { await getApp(); token = await getAdminToken(); }, 30000);
afterAll(async () => { await closeApp(); });

describe('Products E2E', () => {
  it('lists products', async () => {
    const res = await gql(token, `{ products(dispensaryId: "${DISP}") { id name strainType thcPercent cbdPercent } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  it('products have variants', async () => {
    const res = await gql(token, `{ products(dispensaryId: "${DISP}") { id name variants { variantId name } } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.products[0].variants).toBeDefined();
  });

  it('has valid strain types', async () => {
    const res = await gql(token, `{ products(dispensaryId: "${DISP}") { strainType } }`);
    expect(res.status).toBe(200);
    for (const p of res.body.data.products) {
      expect(['indica', 'sativa', 'hybrid', null]).toContain(p.strainType);
    }
  });

  it('searches products', async () => {
    const res = await gql(token, `{ autocompleteProducts(dispensaryId: "${DISP}", query: "blue") { id name } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.autocompleteProducts).toBeDefined();
  });

  it('product count works', async () => {
    const res = await gql(token, `{ productCount(dispensaryId: "${DISP}") }`);
    expect(res.status).toBe(200);
    expect(res.body.data.productCount).toBeGreaterThan(0);
  });
});
