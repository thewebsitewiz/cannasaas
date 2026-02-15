import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, FulfillmentType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { ComplianceService } from 'src/compliance/compliance.service';

export interface CheckoutDto {
  dispensaryId: string;
  fulfillmentType: FulfillmentType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    private cartService: CartService,
    private productsService: ProductsService,
    private dataSource: DataSource,
    private complianceService: ComplianceService,
  ) {}

  async checkout(
    userId: string,
    tenantId: string,
    dto: CheckoutDto,
  ): Promise<Order> {
    const cartSummary = await this.cartService.getCartSummary(
      userId,
      dto.dispensaryId,
    );

    if (cartSummary.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Use a transaction — either everything succeeds or nothing does
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate taxes (simplified — adapt to your state's tax rules)
      const subtotal = cartSummary.subtotal;
      const taxRate = 0.08875; // NY combined rate example
      const exciseTaxRate = 0.09; // NY cannabis excise tax
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const exciseTax = Math.round(subtotal * exciseTaxRate * 100) / 100;
      const total = subtotal + taxAmount + exciseTax;

      // Generate order number
      const orderNumber = await this.generateOrderNumber(dto.dispensaryId);

      // Create order
      const order = this.orderRepository.create({
        orderNumber,
        userId,
        dispensaryId: dto.dispensaryId,
        tenantId,
        subtotal,
        taxAmount,
        exciseTax,
        total,
        fulfillmentType: dto.fulfillmentType,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items (snapshot product data)
      for (const cartItem of cartSummary.items) {
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: cartItem.variant.product.id,
          variantId: cartItem.variantId,
          productName: cartItem.variant.product.name,
          variantName: cartItem.variant.name,
          unitPrice: cartItem.unitPrice,
          quantity: cartItem.quantity,
          lineTotal: Number(cartItem.unitPrice) * cartItem.quantity,
          batchNumber: cartItem.variant.product.batchNumber,
          licenseNumber: cartItem.variant.product.licenseNumber,
        });
        await queryRunner.manager.save(orderItem);

        // Decrement inventory
        await this.productsService.updateInventory(
          cartItem.variantId,
          -cartItem.quantity,
        );
      }

      // Create initial status history entry
      const statusHistory = this.statusHistoryRepository.create({
        orderId: savedOrder.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedBy: userId,
        notes: 'Order placed',
      });
      await queryRunner.manager.save(statusHistory);

      // Clear the cart
      await this.cartService.clearCart(userId, dto.dispensaryId);

      await queryRunner.commitTransaction();

      // After queryRunner.commitTransaction() in checkout():
      const fullOrder = await this.findOne(savedOrder.id);
      await this.complianceService.logSale(fullOrder, userId);

      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
      order: { statusHistory: { createdAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async findByUser(userId: string, dispensaryId?: string): Promise<Order[]> {
    const where: any = { userId };
    if (dispensaryId) where.dispensaryId = dispensaryId;

    return this.orderRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDispensary(
    dispensaryId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const where: any = { dispensaryId };
    if (status) where.status = status;

    return this.orderRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    notes?: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    const oldStatus = order.status;

    // Validate status transition
    this.validateStatusTransition(oldStatus, newStatus);

    order.status = newStatus;

    // Set timestamps
    if (newStatus === OrderStatus.CONFIRMED) order.confirmedAt = new Date();
    if (newStatus === OrderStatus.COMPLETED) order.completedAt = new Date();
    if (newStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      // Restore inventory on cancellation
      for (const item of order.items) {
        await this.productsService.updateInventory(
          item.variantId,
          item.quantity,
        );
      }
    }

    await this.orderRepository.save(order);

    // Record status change
    const statusHistory = this.statusHistoryRepository.create({
      orderId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy,
      notes,
    });
    await this.statusHistoryRepository.save(statusHistory);

    return this.findOne(orderId);
  }

  private validateStatusTransition(from: OrderStatus, to: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_PICKUP]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(`Cannot transition from ${from} to ${to}`);
    }
  }

  private async generateOrderNumber(dispensaryId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.orderRepository.count({
      where: { dispensaryId },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `ORD-${today}-${seq}`;
  }

  async hasUserPurchasedProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.userId = :userId', { userId })
      .andWhere('item.productId = :productId', { productId })
      .getOne();
    return !!order;
  }
}
