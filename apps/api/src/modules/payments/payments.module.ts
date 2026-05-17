import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Payment } from './entities/payment.entity';
import { DispensaryPaymentProcessor } from './entities/dispensary-payment-processor.entity';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { CashlessPaymentsService } from './cashless-payments.service';
import { CashlessPaymentsResolver } from './cashless-payments.resolver';
import { DispensaryProcessorConfigService } from './dispensary-processor-config.service';
import { DispensaryProcessorConfigResolver } from './dispensary-processor-config.resolver';
import { CredentialEncryptionService } from './security/credential-encryption.service';
import { AeropayOnboardingService } from './onboarding/aeropay-onboarding.service';
import { AeropayOnboardingResolver } from './onboarding/aeropay-onboarding.resolver';
import { CanPayOnboardingService } from './onboarding/canpay-onboarding.service';
import { CanPayOnboardingResolver } from './onboarding/canpay-onboarding.resolver';
import { NoopPaymentProcessor } from './processors/noop.processor';
import { AeropayPaymentProcessor } from './processors/aeropay/aeropay.processor';
import { CanPayPaymentProcessor } from './processors/canpay/canpay.processor';
import { PaymentProcessorRegistry } from './processors/payment-processor.registry';
import { PAYMENT_PROCESSOR } from './processors/payment-processor.interface';
import { PaymentLifecycleQueueService } from './queue/payment-lifecycle.queue-service';
import { PaymentLifecycleProcessor } from './queue/payment-lifecycle.processor';
import { PAYMENT_LIFECYCLE_QUEUE } from './queue/payment-lifecycle.queue';
import { PaymentWebhookListener } from './listeners/payment-webhook.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, DispensaryPaymentProcessor]),
    BullModule.registerQueue({ name: PAYMENT_LIFECYCLE_QUEUE }),
  ],
  providers: [
    PaymentService,
    PaymentResolver,
    CashlessPaymentsService,
    CashlessPaymentsResolver,
    DispensaryProcessorConfigService,
    DispensaryProcessorConfigResolver,
    CredentialEncryptionService,
    AeropayOnboardingService,
    AeropayOnboardingResolver,
    CanPayOnboardingService,
    CanPayOnboardingResolver,
    NoopPaymentProcessor,
    AeropayPaymentProcessor,
    CanPayPaymentProcessor,
    {
      provide: PAYMENT_PROCESSOR,
      useFactory: (
        noop: NoopPaymentProcessor,
        aeropay: AeropayPaymentProcessor,
        canpay: CanPayPaymentProcessor,
      ) => [noop, aeropay, canpay],
      inject: [
        NoopPaymentProcessor,
        AeropayPaymentProcessor,
        CanPayPaymentProcessor,
      ],
    },
    PaymentProcessorRegistry,
    PaymentLifecycleQueueService,
    PaymentLifecycleProcessor,
    PaymentWebhookListener,
  ],
  exports: [
    PaymentService,
    CashlessPaymentsService,
    DispensaryProcessorConfigService,
    AeropayOnboardingService,
    CanPayOnboardingService,
    PaymentProcessorRegistry,
    PaymentLifecycleQueueService,
  ],
})
export class PaymentsModule {}
