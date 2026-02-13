import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ length: 30 })
  type: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
