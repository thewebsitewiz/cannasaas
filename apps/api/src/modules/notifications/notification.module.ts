import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationTemplate, NotificationLog])],
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService],
})
export class NotificationModule {}
