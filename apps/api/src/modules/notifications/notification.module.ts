import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NotificationTemplate,
  NotificationLog,
} from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { CacheModule } from '../../common/services/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, NotificationLog]),
    CacheModule,
  ],
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService],
})
export class NotificationModule {}
