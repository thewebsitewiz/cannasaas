import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId: string;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'int' })
  previousQuantity: number;

  @Column({ name: 'new_quantity', type: 'int' })
  newQuantity: number;

  @Column({ length: 255, nullable: true })
  reason: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
