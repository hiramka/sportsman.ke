import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Index()
  phone: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'customer' })
  role: string;
}
