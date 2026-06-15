import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/Order.entity';
import { OrderItem } from '../entities/OrderItem.entity';
import { Product } from '../entities/Product.entity';
import { Coupon } from '../entities/Coupon.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthModule } from '../auth/auth.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Coupon]),
    AuthModule, // Include auth token guards support
    ProductModule, // Import ProductModule for cache eviction
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
