import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PaymentProcessorRegistry } from './processors/payment-processor.registry';
import { PAYMENT_PROCESSOR } from './processors/payment-processor.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, DispensaryPaymentProcessor])],
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
    {
      provide: PAYMENT_PROCESSOR,
      useFactory: (noop: NoopPaymentProcessor) => [noop],
      inject: [NoopPaymentProcessor],
    },
    PaymentProcessorRegistry,
  ],
  exports: [
    PaymentService,
    CashlessPaymentsService,
    DispensaryProcessorConfigService,
    AeropayOnboardingService,
    CanPayOnboardingService,
    PaymentProcessorRegistry,
  ],
})
export class PaymentsModule {}
