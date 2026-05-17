import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAYMENT_PROCESSOR,
  PaymentProcessor,
  PaymentProcessorName,
} from './payment-processor.interface';

@Injectable()
export class PaymentProcessorRegistry {
  private readonly byName = new Map<PaymentProcessorName, PaymentProcessor>();

  constructor(
    @Inject(PAYMENT_PROCESSOR) processors: readonly PaymentProcessor[],
  ) {
    for (const processor of processors) {
      if (this.byName.has(processor.name)) {
        throw new Error(
          `Duplicate PaymentProcessor registered for name "${processor.name}"`,
        );
      }
      this.byName.set(processor.name, processor);
    }
  }

  get(name: PaymentProcessorName): PaymentProcessor {
    const processor = this.byName.get(name);
    if (!processor) {
      throw new NotFoundException(
        `No payment processor registered for "${name}"`,
      );
    }
    return processor;
  }

  has(name: PaymentProcessorName): boolean {
    return this.byName.has(name);
  }

  list(): readonly PaymentProcessorName[] {
    return Array.from(this.byName.keys());
  }
}
