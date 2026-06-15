import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  @Index()
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'int' })
  stockQuantity: number;

  @Column({ type: 'int', default: 3 })
  reorderThreshold: number;

  @Column()
  @Index()
  brand: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  warehouseLocation: string;
}
