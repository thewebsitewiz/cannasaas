// cannasaas-api/src/common/logger/winston.config.ts
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : utilities.format.nestLike('CannaSaas', {
              prettyPrint: true, colors: true }),
      ),
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log', level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(), winston.format.json()),
        maxsize: 10 * 1024 * 1024, maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(), winston.format.json()),
        maxsize: 50 * 1024 * 1024, maxFiles: 10,
      }),
    ] : []),
  ],
});
