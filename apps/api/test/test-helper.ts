// test/test-helper.ts
import { INestApplication, VersioningType, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import * as request from 'supertest';

export const DISP = 'b406186e-4d6a-425b-b7af-851cde868c5c';
export const ORG = 'e72ff942-705c-497b-9912-9f0e2e1d6633';

let _app: INestApplication;
let _server: any;

export async function getApp(): Promise<INestApplication> {
  if (_app) return _app;
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  _app = module.createNestApplication();
  _app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  _app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false, transformOptions: { enableImplicitConversion: true } }));
  _app.useGlobalFilters(new GlobalExceptionFilter());
  await _app.init();
  _server = _app.getHttpServer();
  return _app;
}
export function getServer() { return _server; }
export async function closeApp() { if (_app) { await _app.close(); _app = null as any; } }

export async function getAdminToken(): Promise<string> {
  const res = await request(getServer()).post('/v1/auth/login').send({ email: 'admin@greenleaf.com', password: 'Admin123!' });
  return res.body.accessToken;
}
export async function getCustomerToken(): Promise<string> {
  const res = await request(getServer()).post('/v1/auth/login').send({ email: 'john.doe@email.com', password: 'Admin123!' });
  return res.body.accessToken;
}
export function gql(token: string, query: string, variables?: any) {
  return request(getServer()).post('/graphql').set('Authorization', 'Bearer ' + token).set('x-dispensary-id', DISP).set('x-organization-id', ORG).send({ query, variables });
}
