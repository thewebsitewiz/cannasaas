// apps/api/src/main.ts
import 'reflect-metadata';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as net from 'net';
import * as path from 'path';
import { json, urlencoded } from 'express';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

/**
 * TCP-probe Postgres + Redis before NestFactory wires anything up. Without
 * this, BullMQ + TypeORM each spin retry loops with 20+ stack traces before
 * the developer sees a useful error. Fail fast with one clear line instead.
 */
async function preflightDeps(): Promise<void> {
  const logger = new Logger('Preflight');
  const checks: Array<{ name: string; host: string; port: number }> = [
    {
      name: 'redis',
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: Number.parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    },
  ];

  const dbUrl = process.env['DATABASE_URL'];
  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      checks.push({
        name: 'postgres',
        host: u.hostname,
        port: u.port ? Number.parseInt(u.port, 10) : 5432,
      });
    } catch {
      // bad URL — let TypeORM surface the parse error with full context
    }
  }

  const failed: string[] = [];
  for (const c of checks) {
    const reachable = await canConnect(c.host, c.port, 2000);
    if (!reachable) failed.push(`${c.name} @ ${c.host}:${c.port}`);
  }

  if (failed.length > 0) {
    logger.error(
      `Cannot reach: ${failed.join(', ')}. Is Docker up? (run \`dockup\`)`,
    );
    process.exit(1);
  }
}

function canConnect(
  host: string,
  port: number,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (ok: boolean): void => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
    socket.connect(port, host);
  });
}

async function bootstrap(): Promise<void> {
  await preflightDeps();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const isProd = config.get<string>('nodeEnv') === 'production';

  if (isProd) {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );
  }
  app.use(compression());
  app.use(cookieParser());

  // Request body size limits (webhook endpoint gets a larger limit for payment-processor payloads)
  app.use('/v1/webhooks', json({ limit: '5mb' }));
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Serve uploaded images
  const uploadDir =
    process.env['UPLOAD_DIR'] || path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.enableCors({
    origin: (() => {
      const o = config.get<string[] | string | undefined>('corsOrigins');
      if (Array.isArray(o)) return o;
      if (typeof o === 'string') return o.split(',');
      // Dev defaults match the actual app port scheme (see CLAUDE.md):
      // 5177 platform (React), 5273-5276 Angular projects.
      return [
        'http://localhost:5177',
        'http://localhost:5273',
        'http://localhost:5274',
        'http://localhost:5275',
        'http://localhost:5276',
      ];
    })(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // GlobalExceptionFilter + LoggingInterceptor are wired through AppModule
  // as APP_FILTER / APP_INTERCEPTOR providers so their @Optional() Sentry +
  // Metrics injections resolve via DI (instead of being undefined when
  // instantiated with bare `new` here).
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableShutdownHooks(); // Graceful shutdown: drain connections on SIGTERM/SIGINT

  if (!isProd) {
    // Bearer JWT is the only auth surface. The previous X-Organization-Id /
    // X-Dispensary-Id apiKey entries are gone — they pointed at headers the
    // (now deleted) TenantMiddleware required but never validated. Tenant
    // context lives on the JWT payload.
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CannaSaas API')
      .setDescription('Multi-tenant cannabis platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(
    `CannaSaas API listening on port ${port} [${config.get<string>('nodeEnv')}]`,
  );
}

void bootstrap();
