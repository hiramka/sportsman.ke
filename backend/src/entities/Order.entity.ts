import { Entity, Column, PrimaryColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { OrderItem } from './OrderItem.entity';
import { User } from './User.entity';

@Entity('orders')
export class Order {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.orders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  customerName: string;

  @Column()
  @Index()
  email: string;

  @Column()
  @Index()
  phone: string;

  @Column({ type: 'text' })
  deliveryAddress: string;

  @Column()
  subCounty: string;

  @Column({ type: 'float' })
  subtotal: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ nullable: true })
  couponApplied: string;

  @Column()
  @Index()
  status: string;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  mpesaReference: string;

  @Column({ nullable: true })
  mpesaCheckoutRequestId: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  courierName: string;

  @Column()
  @Index()
  date: string;

  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ type: 'text', default: '[]' })
  timelineJson: string; // Serialized JSON string for SQLite/PG cross-compatibility

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];
}
