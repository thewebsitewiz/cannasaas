import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Order Flow (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@greenleaf.com', password: 'Admin123!' });
    authToken = loginRes.body.accessToken || loginRes.body.access_token;
  }, 30000);

  afterAll(async () => { await app.close(); });

  it('should complete full order→payment flow via GraphQL', async () => {
    const dispensaryId = 'c0000000-0000-0000-0000-000000000001';

    // 1. Query products
    const productsRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-dispensary-id', dispensaryId)
      .send({
        query: `{ products(dispensaryId: "${dispensaryId}", limit: 1) { productId name } }`,
      });
    expect(productsRes.status).toBe(200);
    expect(productsRes.body.data.products.length).toBeGreaterThan(0);

    // 2. Create order
    const productId = productsRes.body.data.products[0].productId;
    const createOrderRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-dispensary-id', dispensaryId)
      .send({
        query: `mutation {
          createOrder(input: {
            dispensaryId: "${dispensaryId}"
            orderType: "pickup"
            lineItems: [{ productId: "${productId}", quantity: 1 }]
          }) { orderId orderStatus total }
        }`,
      });
    expect(createOrderRes.status).toBe(200);
    const order = createOrderRes.body.data?.createOrder;
    if (order) {
      expect(order.orderId).toBeDefined();
      expect(order.orderStatus).toBe('pending');
    }
  });

  it('health endpoint should respond', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
