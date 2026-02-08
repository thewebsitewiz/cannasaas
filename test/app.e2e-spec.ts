import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.info).toHaveProperty('postgres');
          expect(res.body.info).toHaveProperty('mongodb');
        });
    });
  });

  describe('Tenant Isolation', () => {
    it('should reject requests without valid tenant subdomain', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Host', 'invalid.localhost')
        .expect(404);
    });

    it('should accept requests with valid tenant subdomain', async () => {
      // This test assumes 'demo' tenant exists from init script
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Host', 'demo.localhost')
        .expect((res) => {
          // Should not be 404 (tenant not found)
          expect(res.status).not.toBe(404);
        });
    });
  });
});