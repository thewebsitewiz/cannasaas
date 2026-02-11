import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, FulfillmentType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CartService } from './cart.service';
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
export declare class OrdersService {
    private orderRepository;
    private orderItemRepository;
    private statusHistoryRepository;
    private cartService;
    private productsService;
    private dataSource;
    private complianceService;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, statusHistoryRepository: Repository<OrderStatusHistory>, cartService: CartService, productsService: ProductsService, dataSource: DataSource, complianceService: ComplianceService);
    checkout(userId: string, tenantId: string, dto: CheckoutDto): Promise<Order>;
    findOne(id: string): Promise<Order>;
    findByUser(userId: string, dispensaryId?: string): Promise<Order[]>;
    findByDispensary(dispensaryId: string, status?: OrderStatus): Promise<Order[]>;
    updateStatus(orderId: string, newStatus: OrderStatus, changedBy: string, notes?: string): Promise<Order>;
    private validateStatusTransition;
    private generateOrderNumber;
}
