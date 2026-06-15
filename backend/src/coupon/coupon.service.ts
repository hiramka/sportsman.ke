import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/Coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async findAll() {
    return this.couponRepository.find();
  }

  async findByCode(code: string) {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase().trim() }
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon code "${code}" is invalid or expired.`);
    }
    return coupon;
  }

  async create(couponDto: any) {
    const code = couponDto.code.toUpperCase().trim();
    const count = await this.couponRepository.count({ where: { code } });
    
    if (count > 0) {
      throw new BadRequestException(`Coupon "${code}" already exists.`);
    }

    const coupon = this.couponRepository.create({
      id: `c-${Date.now()}`,
      code,
      discountPercentage: Number(couponDto.discountPercentage),
      description: couponDto.description,
    });

    return this.couponRepository.save(coupon);
  }
}
