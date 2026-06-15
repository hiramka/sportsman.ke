import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'int' })
  discountPercentage: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
