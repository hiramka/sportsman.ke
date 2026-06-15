import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as net from 'net';

// Entities
import { User } from './entities/User.entity';
import { Product } from './entities/Product.entity';
import { Order } from './entities/Order.entity';
import { OrderItem } from './entities/OrderItem.entity';
import { Coupon } from './entities/Coupon.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { CouponModule } from './coupon/coupon.module';
import { MpesaModule } from './mpesa/mpesa.module';
import { SupabaseModule } from './supabase/supabase.module';

import * as bcrypt from 'bcrypt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Limit each IP to 100 requests per minute
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        let dbType = configService.get<string>('DB_TYPE');
        const host = configService.get<string>('DB_HOST') || 'localhost';
        const port = parseInt(configService.get<string>('DB_PORT'), 10) || 5432;
        const username = configService.get<string>('DB_USERNAME') || 'postgres';
        const database = configService.get<string>('DB_DATABASE') || 'sportman';
        const useSsl = configService.get<string>('DB_SSL') === 'true';
        console.log(`🔌 Database connection configuration resolved:`);
        console.log(`   - Type:     ${dbType}`);
        console.log(`   - Host:     ${host}`);
        console.log(`   - Port:     ${port}`);
        console.log(`   - Username: ${username}`);
        console.log(`   - Database: ${database}`);
        console.log(`   - SSL:      ${useSsl}`);

        if (dbType === 'postgres') {
          // Perform a quick TCP reachability check (2s timeout) to prevent ETIMEDOUT crashes in sandbox environments
          const isReachable = await new Promise<boolean>((resolve) => {
            const socket = new net.Socket();
            const timer = setTimeout(() => {
              socket.destroy();
              resolve(false);
            }, 2000);
            socket.connect(port, host, () => {
              clearTimeout(timer);
              socket.end();
              resolve(true);
            });
            socket.on('error', () => {
              clearTimeout(timer);
              resolve(false);
            });
          });

          if (!isReachable) {
            console.warn(`\n⚠️  WARNING: Supabase host ${host}:${port} is unreachable (TCP Timeout).`);
            console.warn(`👉 Automatically falling back to local SQLite database (sportman_sandbox.db) to prevent application crash.\n`);
            dbType = 'sqlite';
          }
        }

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host,
            port,
            username,
            password: configService.get<string>('DB_PASSWORD') || 'postgres',
            database,
            entities: [User, Product, Order, OrderItem, Coupon],
            synchronize: true,
            logging: false,
            ssl: useSsl ? { rejectUnauthorized: false } : false,
            extra: {
              max: 15,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 30000,
              keepAlive: true,
              keepAliveInitialDelayMillis: 10000,
            },
          };
        } else {
          return {
            type: 'sqlite',
            database: 'sportman_sandbox.db',
            entities: [User, Product, Order, OrderItem, Coupon],
            synchronize: true,
            logging: false,
          };
        }
      },
    }),
    AuthModule,
    ProductModule,
    OrderModule,
    CouponModule,
    MpesaModule,
    SupabaseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}

  // Lifecycle Seed: Ensure baseline mock products, coupons, and staff credentials exist on boot!
  async onModuleInit() {
    console.log('🌱 Seeding database with baseline mock data...');

    // Migration routine for legacy roles
    try {
      await this.entityManager.createQueryBuilder()
        .update(User)
        .set({ role: 'warehouse_staff' })
        .where("role = :oldRole", { oldRole: 'warehouse' })
        .execute();
      await this.entityManager.createQueryBuilder()
        .update(User)
        .set({ role: 'delivery_agent' })
        .where("role = :oldRole", { oldRole: 'delivery' })
        .execute();
      console.log('✓ Legacy database roles migrated successfully.');
    } catch (err) {
      console.warn('Failed to run role migration query:', err.message);
    }

    // 1. Seed Users (Admin, Warehouse, Delivery, Customer)
    const seedRoles = [
      { role: 'admin', email: 'admin@sportman.ke', password: 'admin123', name: 'Admin User' },
      { role: 'warehouse_staff', email: 'warehouse@sportman.ke', password: 'warehouse123', name: 'Warehouse Staff' },
      { role: 'delivery_agent', email: 'delivery@sportman.ke', password: 'delivery123', name: 'Delivery Agent' },
      { role: 'customer', email: 'customer@sportman.ke', password: 'customer123', name: 'Customer User' }
    ];

    for (const s of seedRoles) {
      const count = await this.entityManager.count(User, { where: { email: s.email } });
      if (count === 0) {
        const passwordHash = await bcrypt.hash(s.password, 10);
        const newUser = this.entityManager.create(User, {
          name: s.name,
          email: s.email,
          phone: s.role === 'customer' ? '0712345678' : '0722000000',
          passwordHash,
          role: s.role,
        });
        await this.entityManager.save(User, newUser);
        console.log(`✓ Seeded User: ${s.email} (Password: ${s.password})`);
      }
    }

    // 2. Seed Default Coupons
    const defaultCoupons = [
      { id: 'c-1', code: 'SPORT50', discountPercentage: 50, description: '50% off flash sale' },
      { id: 'c-2', code: 'KIPCHOGE', discountPercentage: 20, description: '20% off marathon special' },
      { id: 'c-3', code: 'NAIROBI10', discountPercentage: 10, description: '10% off local delivery' }
    ];

    for (const c of defaultCoupons) {
      const count = await this.entityManager.count(Coupon, { where: { code: c.code } });
      if (count === 0) {
        const newCoupon = this.entityManager.create(Coupon, c);
        await this.entityManager.save(Coupon, newCoupon);
        console.log(`✓ Seeded Coupon: ${c.code}`);
      }
    }

    // 3. Seed Default Products
    const defaultProducts = [
      {
        id: 'prod-1',
        name: 'Sportman Pro Match Football',
        category: 'Football',
        description: 'FIFA-quality match football with superior aerodynamics and textured grip. Designed for all weather conditions in Nairobi stadiums.',
        price: 3500,
        stockQuantity: 25,
        reorderThreshold: 5,
        brand: 'Sportman',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle A - Row 1'
      },
      {
        id: 'prod-2',
        name: 'Nairobi Giants Official Jersey 2026',
        category: 'Jerseys',
        description: 'Breathable, sweat-wicking lightweight official team home jersey. Show your pride in Nairobi Giants style!',
        price: 2500,
        stockQuantity: 15,
        reorderThreshold: 5,
        brand: 'Sportman',
        imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle A - Row 3'
      },
      {
        id: 'prod-3',
        name: 'Elite Grip Basketball (Size 7)',
        category: 'Basketball',
        description: 'Composite leather basketball optimized for both indoor wooden courts and outdoor neighborhood courts.',
        price: 4200,
        stockQuantity: 8,
        reorderThreshold: 3,
        brand: 'Spalding',
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle B - Row 2'
      },
      {
        id: 'prod-4',
        name: 'Speedster Football Boots FG',
        category: 'Boots',
        description: 'Ultralight firm-ground cleats with stud configuration engineered for explosive speed and sudden pivots.',
        price: 6800,
        stockQuantity: 4,
        reorderThreshold: 5,
        brand: 'Sportman',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle C - Row 4'
      },
      {
        id: 'prod-5',
        name: 'Professional Table Tennis Table',
        category: 'Table Tennis',
        description: 'Tournament-ready full-size table tennis table with premium 25mm blue playtop surface. Easily foldable.',
        price: 45000,
        stockQuantity: 2,
        reorderThreshold: 2,
        brand: 'Donic',
        imageUrl: 'https://images.unsplash.com/photo-1609710223199-14b36c6ca5d4?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Zone D - Shelf 1'
      },
      {
        id: 'prod-6',
        name: 'Carbon Ping Pong Racket',
        category: 'Table Tennis',
        description: 'High-speed defensive/offensive carbon-fiber ping pong racket with premium competition ITTF rubber.',
        price: 3800,
        stockQuantity: 12,
        reorderThreshold: 4,
        brand: 'Butterfly',
        imageUrl: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle B - Row 4'
      },
      {
        id: 'prod-7',
        name: '3-Star Table Tennis Balls (12-Pack)',
        category: 'Table Tennis',
        description: 'White seamless 40mm competition table tennis balls. Outstanding bounce, roundness and durability.',
        price: 1200,
        stockQuantity: 38,
        reorderThreshold: 10,
        brand: 'Donic',
        imageUrl: 'https://images.unsplash.com/photo-1620987278429-ca18c53d279d?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle B - Row 5'
      },
      {
        id: 'prod-8',
        name: 'Classic Basketball Hoop Net (Pair)',
        category: 'Basketball',
        description: 'Heavy duty, all-weather white nylon replacement basketball nets. Fits standard 12-loop basketball rims.',
        price: 950,
        stockQuantity: 5,
        reorderThreshold: 3,
        brand: 'Sportman',
        imageUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=500&auto=format&fit=crop&q=60',
        warehouseLocation: 'Aisle B - Row 3'
      }
    ];

    for (const p of defaultProducts) {
      const count = await this.entityManager.count(Product, { where: { id: p.id } });
      if (count === 0) {
        const newProduct = this.entityManager.create(Product, p);
        await this.entityManager.save(Product, newProduct);
        console.log(`✓ Seeded Product: ${p.name}`);
      }
    }

    console.log('🌱 Mock Seeding completed successfully!');
  }
}
