import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Order } from './Order.entity';
import { Product } from './Product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float' })
  price: number;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  @Index()
  order: Order;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  @Index()
  product: Product;

  toJSON() {
    const { order, ...rest } = this;
    return rest;
  }
}
