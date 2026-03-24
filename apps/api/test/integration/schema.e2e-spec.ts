import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('GraphQL Schema (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => { await app.close(); });

  it('should expose introspection with expected types', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          __schema {
            queryType { name }
            mutationType { name }
            types { name kind }
          }
        }`,
      });
    expect(res.status).toBe(200);
    const typeNames = res.body.data.__schema.types.map((t: any) => t.name);

    // Verify critical types exist in schema
    const requiredTypes = [
      'Product', 'Order', 'User', 'Dispensary', 'Organization',
      'CustomerProfile', 'InventoryItem', 'ThemeConfig',
    ];
    for (const type of requiredTypes) {
      expect(typeNames).toContain(type);
    }
  });

  it('should have query and mutation types', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `{ __schema { queryType { fields { name } } mutationType { fields { name } } } }` });

    const queryFields = res.body.data.__schema.queryType.fields.map((f: any) => f.name);
    const mutationFields = res.body.data.__schema.mutationType.fields.map((f: any) => f.name);

    // Verify critical queries exist
    expect(queryFields).toContain('products');
    expect(queryFields).toContain('orders');
    expect(queryFields).toContain('dashboard');

    // Verify critical mutations exist
    expect(mutationFields).toContain('createOrder');
    expect(mutationFields).toContain('login');
    expect(mutationFields).toContain('register');
  });
});
