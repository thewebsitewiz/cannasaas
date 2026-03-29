/**
 * Unified order event — emitted at every stage of the order lifecycle.
 * The notification service uses `orderType` to decide whether to notify.
 */
export class OrderEvent {
  constructor(
    public readonly orderId: string,
    public readonly dispensaryId: string,
    public readonly status: string,
    public readonly customerUserId?: string | null,
    public readonly orderType?: string | null,
    public readonly total?: number | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
