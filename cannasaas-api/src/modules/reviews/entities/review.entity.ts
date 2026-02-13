// cannasaas-api/src/modules/reviews/entities/review.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../../products/entities/product.entity';
import { User } from '../../../users/entities/user.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('reviews')
@Index(['productId', 'status'])
@Index(['userId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid' as any)
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int', default: 5 })
  rating: number; // 1-5

  @Column('text')
  title: string;

  @Column('text')
  body: string;

  @Column({ type: 'boolean', default: false })
  verifiedPurchase: boolean;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'int', default: 0 })
  helpfulVotes: number;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
