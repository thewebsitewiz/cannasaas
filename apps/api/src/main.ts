// apps/api/src/main.ts
import 'reflect-metadata';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const isProd = config.get<string>('nodeEnv') === 'production';

  if (isProd) {
    app.use(helmet());
  } else {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  }
  app.use(compression());
  app.use(cookieParser());

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
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useWebSocketAdapter(new IoAdapter(app));

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
  console.warn(`CannaSaas API listening on port ${port} [${config.get<string>('nodeEnv')}]`);
}

bootstrap();
