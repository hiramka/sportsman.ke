import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/Order.entity';
import { OrderModule } from '../order/order.module';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    OrderModule, // Connects order service workflows
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
