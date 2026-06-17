import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCompletedEvent } from '../../orders/events/order-completed.event';
import { MetrcSyncQueueService } from '../queue/metrc-sync.queue-service';
import { ORDER_COMPLETED } from '../../../common/events/event-names';

@Injectable()
export class OrderCompletedListener {
  private readonly logger = new Logger(OrderCompletedListener.name);

  constructor(private readonly syncQueue: MetrcSyncQueueService) {}

  @OnEvent(ORDER_COMPLETED)
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    this.logger.log(
      `Order completed: ${event.orderId} — enqueueing Metrc sync`,
    );
    await this.syncQueue.enqueueSaleSync(event.orderId, event.dispensaryId);
  }
}
