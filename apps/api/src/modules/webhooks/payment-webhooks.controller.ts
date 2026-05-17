import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import {
  PaymentProcessor,
  PaymentProcessorName,
  ProcessorWebhookEvent,
  WebhookHeaders,
} from '../payments/processors/payment-processor.interface';
import { PaymentProcessorRegistry } from '../payments/processors/payment-processor.registry';

interface WebhookAck {
  readonly ok: true;
  readonly processor: PaymentProcessorName;
  readonly type: ProcessorWebhookEvent['type'];
  readonly processorTransactionId: string;
}

const SUPPORTED_WEBHOOK_PROCESSORS: readonly PaymentProcessorName[] = [
  'aeropay',
  'canpay',
];

function isSupportedWebhookProcessor(
  name: string,
): name is PaymentProcessorName {
  return (SUPPORTED_WEBHOOK_PROCESSORS as readonly string[]).includes(name);
}

@Controller({ path: 'webhooks/payments', version: '1' })
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(
    private readonly registry: PaymentProcessorRegistry,
    private readonly events: EventEmitter2,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':processor')
  receive(
    @Param('processor') processorName: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: unknown,
  ): WebhookAck {
    if (!isSupportedWebhookProcessor(processorName)) {
      throw new BadRequestException(
        `Unsupported webhook processor "${processorName}"`,
      );
    }

    let processor: PaymentProcessor;
    try {
      processor = this.registry.get(processorName);
    } catch {
      throw new BadRequestException(
        `No payment processor registered for "${processorName}"`,
      );
    }

    const rawBody: string | Buffer =
      req.rawBody ?? Buffer.from(JSON.stringify(body ?? {}));
    const headers: WebhookHeaders = req.headers as WebhookHeaders;

    let event: ProcessorWebhookEvent;
    try {
      event = processor.verifyWebhookSignature(rawBody, headers);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'verification failed';
      this.logger.warn(`Rejected ${processorName} webhook: ${message}`);
      throw new UnauthorizedException(`Invalid webhook signature`);
    }

    this.events.emit(`payment.webhook.${event.type}`, {
      processor: processorName,
      event,
    });
    this.logger.log(
      `Accepted ${processorName} webhook: type=${event.type} tx=${event.processorTransactionId}`,
    );

    return {
      ok: true,
      processor: processorName,
      type: event.type,
      processorTransactionId: event.processorTransactionId,
    };
  }
}
