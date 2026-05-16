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
  ],
  exports: [
    PaymentService,
    CashlessPaymentsService,
    DispensaryProcessorConfigService,
    AeropayOnboardingService,
    CanPayOnboardingService,
  ],
})
export class PaymentsModule {}
