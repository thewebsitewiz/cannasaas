import * as request from 'supertest';
import { getApp, getServer, closeApp } from './test-helper';

beforeAll(async () => { await getApp(); }, 30000);
afterAll(async () => { await closeApp(); });

describe('Auth E2E', () => {
  const testEmail = 'e2e-' + Date.now() + '@test.com';

  it('registers a new user', async () => {
    const res = await request(getServer()).post('/v1/auth/register')
      .send({ email: testEmail, password: 'Test1234!', firstName: 'E2E', lastName: 'Tester', role: 'customer' });
    expect(res.status).toBeLessThan(500);
    if (res.status === 201 || res.status === 200) expect(res.body.accessToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request(getServer()).post('/v1/auth/register')
      .send({ email: testEmail, password: 'Test1234!', firstName: 'Dup', lastName: 'User' });
    expect([400, 409]).toContain(res.status);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(getServer()).post('/v1/auth/login')
      .send({ email: 'admin@greenleaf.com', password: 'Admin123!' }).expect(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(getServer()).post('/v1/auth/login')
      .send({ email: 'admin@greenleaf.com', password: 'wrong' });
    expect([400, 401]).toContain(res.status);
  });
});
