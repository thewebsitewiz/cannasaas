export class OrderCompletedEvent {
  constructor(
    public readonly orderId: string,
    public readonly dispensaryId: string,
    public readonly completedAt: Date,
  ) {}
}
