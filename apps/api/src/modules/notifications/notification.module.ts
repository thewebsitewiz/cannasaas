import { Module } from '@nestjs/common';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';

@Module({
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService],
})
export class NotificationModule {}
