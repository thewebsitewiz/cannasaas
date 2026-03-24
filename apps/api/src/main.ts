// apps/api/src/main.ts
import 'reflect-metadata';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { json, urlencoded } from 'express';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // Use NestJS structured logger (outputs JSON in production)
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const isProd = config.get<string>('nodeEnv') === 'production';

  if (isProd) {
    app.use(helmet());
  } else {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  }
  app.use(compression());
  app.use(cookieParser());

  // Request body size limits (webhook endpoint gets a larger limit for Stripe payloads)
  app.use('/v1/webhooks', json({ limit: '5mb' }));
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Serve uploaded images
  const uploadDir = process.env['UPLOAD_DIR'] || path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.enableCors({
    origin: (() => {
      const o = config.get('corsOrigins');
      return Array.isArray(o)
        ? o
        : typeof o === 'string'
        ? o.split(',')
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
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

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableShutdownHooks(); // Graceful shutdown: drain connections on SIGTERM/SIGINT

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CannaSaas API')
      .setDescription('Multi-tenant cannabis platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Organization-Id' }, 'OrganizationId')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Dispensary-Id' }, 'DispensaryId')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`CannaSaas API listening on port ${port} [${config.get<string>('nodeEnv')}]`);
}

bootstrap();
