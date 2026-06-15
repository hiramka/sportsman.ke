import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  async getAllCoupons() {
    return this.couponService.findAll();
  }

  @Get('code/:code')
  async getCouponByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles('admin')
  async createCoupon(@Body() couponDto: any) {
    return this.couponService.create(couponDto);
  }
}
