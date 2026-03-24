import { Module } from '@nestjs/common';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { BackInStockService } from './back-in-stock.service';
import { BackInStockResolver } from './back-in-stock.resolver';

@Module({
  providers: [NotificationService, NotificationResolver, BackInStockService, BackInStockResolver],
  exports: [NotificationService, BackInStockService],
})
export class NotificationModule {}
