import { Module } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { CashlessPaymentsService } from './cashless-payments.service';
import { CashlessPaymentsResolver } from './cashless-payments.resolver';

@Module({
  providers: [PaymentService, PaymentResolver, CashlessPaymentsService, CashlessPaymentsResolver],
  exports: [PaymentService, CashlessPaymentsService],
})
export class PaymentsModule {}
