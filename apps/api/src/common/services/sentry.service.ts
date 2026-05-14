import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Sentry integration stub — provides error reporting methods.
 * When SENTRY_DSN is configured, errors are sent to Sentry.
 * When not configured, falls back to local logging only.
 */

interface SentryShape {
  init(opts: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    release: string;
  }): void;
  setContext(name: string, ctx: Record<string, unknown>): void;
  captureException(err: Error): void;
  captureMessage(msg: string, level: 'info' | 'warning' | 'error'): void;
}

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  async onModuleInit(): Promise<void> {
    const dsn = process.env['SENTRY_DSN'];
    if (dsn) {
      try {
        const Sentry = (await import(
          /* webpackIgnore: true */ '@sentry/node' as string
        )) as SentryShape;
        Sentry.init({
          dsn,
          environment: process.env['NODE_ENV'] ?? 'development',
          tracesSampleRate:
            process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
          release: process.env['APP_VERSION'] ?? '0.1.0',
        });
        this.initialized = true;
        this.logger.log('Sentry initialized');
      } catch {
        this.logger.warn(
          'Sentry SDK not installed — error tracking disabled. Install @sentry/node to enable.',
        );
      }
    } else {
      this.logger.log('SENTRY_DSN not set — error tracking disabled');
    }
  }

  async captureException(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<void> {
    if (this.initialized) {
      try {
        const Sentry = (await import(
          /* webpackIgnore: true */ '@sentry/node' as string
        )) as SentryShape;
        if (context) Sentry.setContext('extra', context);
        Sentry.captureException(error);
      } catch {
        /* Sentry unavailable */
      }
    }
    this.logger.error(error.message, error.stack);
  }

  async captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): Promise<void> {
    if (this.initialized) {
      try {
        const Sentry = (await import(
          /* webpackIgnore: true */ '@sentry/node' as string
        )) as SentryShape;
        Sentry.captureMessage(message, level);
      } catch {
        /* Sentry unavailable */
      }
    }
  }
}
