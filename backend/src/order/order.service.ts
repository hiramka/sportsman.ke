import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../entities/Order.entity';
import { OrderItem } from '../entities/OrderItem.entity';
import { Product } from '../entities/Product.entity';
import { Coupon } from '../entities/Coupon.entity';
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    private readonly dataSource: DataSource,
    private readonly productService: ProductService,
  ) {}

  async findAll() {
    return this.orderRepository.find({
      order: { date: 'DESC' },
      relations: ['items'],
    });
  }

  async findById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found.`);
    }
    return order;
  }

  async findByPhone(phone: string) {
    return this.orderRepository.find({
      where: { phone },
      order: { date: 'DESC' },
      relations: ['items'],
    });
  }

  async findByEmailOrPhone(email: string, phone: string) {
    return this.orderRepository.find({
      where: [
        { email },
        { phone }
      ],
      order: { date: 'DESC' },
      relations: ['items'],
    });
  }

  // Transaction-backed order checkout with Pessimistic Row-Level Locking!
  async create(createDto: any) {
    const { userId, name, email, phone, address, subCounty, paymentMethod, cart, couponCode } = createDto;

    if (!cart || cart.length === 0) {
      throw new BadRequestException('Shopping cart cannot be empty.');
    }

    // Generate a secure, collision-resistant order ID (e.g. SM-123456-ABCD)
    const orderId = `SM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const isPostgres = this.dataSource.options.type === 'postgres';

    // Start database transaction
    const savedOrder = await this.dataSource.transaction(async (entityManager) => {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const cartItem of cart) {
        // Fetch product with a Pessimistic Write Lock (SELECT FOR UPDATE) under PostgreSQL
        const product = await entityManager.findOne(Product, {
          where: { id: cartItem.product.id },
          ...(isPostgres && { lock: { mode: 'pessimistic_write' } }) // <--- Row Lock
        });

        if (!product) {
          throw new BadRequestException(`Product "${cartItem.product.name}" not found.`);
        }

        // Verify stock sufficiency
        if (product.stockQuantity < cartItem.quantity) {
          throw new BadRequestException(
            `Inadequate stock for "${product.name}". Only ${product.stockQuantity} items remaining in warehouse.`
          );
        }

        // Update product stock levels
        product.stockQuantity -= cartItem.quantity;
        await entityManager.save(Product, product);

        // Build item node
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = cartItem.quantity;
        orderItem.price = product.price; // Lock price
        orderItems.push(orderItem);

        subtotal += product.price * cartItem.quantity;
      }

      // Check coupon
      let discountAmount = 0;
      let couponAppliedText = null;

      if (couponCode) {
        const coupon = await entityManager.findOne(Coupon, { where: { code: couponCode.toUpperCase() } });
        if (coupon) {
          discountAmount = Math.round(subtotal * (coupon.discountPercentage / 100));
          couponAppliedText = coupon.code;
        }
      }

      const totalAmount = subtotal - discountAmount;
      const timeline = [
        {
          status: 'Ordered',
          date: new Date().toISOString(),
          message: 'Order has been placed.'
        }
      ];

      // Build Order Entity
      const order = new Order();
      order.id = orderId;
      order.userId = userId || null;
      order.customerName = name;
      order.email = email;
      order.phone = phone;
      order.deliveryAddress = address;
      order.subCounty = subCounty;
      order.subtotal = subtotal;
      order.discountAmount = discountAmount;
      order.totalAmount = totalAmount;
      order.couponApplied = couponAppliedText;
      order.status = (paymentMethod === 'M-Pesa' || paymentMethod === 'WhatsApp') ? 'Pending Payment' : 'Paid';
      order.paymentMethod = paymentMethod;
      order.date = new Date().toISOString();
      order.timelineJson = JSON.stringify(timeline);
      order.items = orderItems;

      if (paymentMethod !== 'M-Pesa') {
        // Card or bank transfer payments are pre-approved/pre-paid
        const updatedTimeline = [
          ...timeline,
          {
            status: 'Paid',
            date: new Date().toISOString(),
            message: 'Transaction successfully processed.'
          }
        ];
        order.timelineJson = JSON.stringify(updatedTimeline);
      }

      const savedOrder = await entityManager.save(Order, order);

      // Save item mappings
      for (const item of orderItems) {
        item.order = savedOrder;
        await entityManager.save(OrderItem, item);
      }

      return savedOrder;
    }); // Transaction commits automatically, rolls back on any exception

    // Evict product cache to reflect new stock levels instantly
    await this.productService.evictCache();

    return savedOrder;
  }

  // Update order status and log progress details
  async updateStatus(id: string, newStatus: string, extraData: any = {}) {
    const isPostgres = this.dataSource.options.type === 'postgres';

    const result = await this.dataSource.transaction(async (entityManager) => {
      // Fetch order with Pessimistic Write Lock
      const order = await entityManager.findOne(Order, {
        where: { id },
        ...(isPostgres && { lock: { mode: 'pessimistic_write' } })
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found.`);
      }

      // Load items separately to avoid Postgres FOR UPDATE outer join lock restriction
      order.items = await entityManager.find(OrderItem, {
        where: { order: { id: order.id } },
        relations: ['product']
      });

      let msg = `Order updated to ${newStatus}`;
      let trackingNum = order.trackingNumber;
      let courier = order.courierName;
      let sig = order.signature;

      if (newStatus === 'Paid') {
        const ref = extraData.mpesaReference || 'MPESA' + Math.random().toString(36).substring(2, 8).toUpperCase();
        order.mpesaReference = ref;
        msg = `M-Pesa payment received. Transaction Ref: ${ref}`;
      } else if (newStatus === 'Approved') {
        msg = 'Order approved by Admin. Released to warehouse packaging queue.';
      } else if (newStatus === 'Preparing') {
        msg = 'Warehouse staff is picking and packing your items.';
      } else if (newStatus === 'Ready for Shipping') {
        msg = 'Order packed and ready for dispatch at central warehouse.';
      } else if (newStatus === 'Shipped') {
        trackingNum = extraData.trackingNumber || `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`;
        courier = extraData.courier || 'BodaBoda Express Nairobi';
        order.trackingNumber = trackingNum;
        order.courierName = courier;
        msg = `Package handed over to ${courier}. Tracking Number: ${trackingNum}`;
      } else if (newStatus === 'Delivered') {
        sig = extraData.signature || 'Customer Signed';
        order.signature = sig;
        msg = 'Package delivered successfully. Thank you for shopping with Sportsman.ke!';
      } else if (newStatus === 'Cancelled') {
        const reason = extraData.reason || 'Requested by Customer';
        msg = `Order has been cancelled. Reason: ${reason}`;

        // Restore catalog stock levels
        for (const item of order.items) {
          const product = await entityManager.findOne(Product, { where: { id: item.product.id } });
          if (product) {
            product.stockQuantity += item.quantity;
            await entityManager.save(Product, product);
          }
        }
      }

      const timeline = JSON.parse(order.timelineJson || '[]');
      timeline.push({
        status: newStatus,
        date: new Date().toISOString(),
        message: msg
      });

      order.status = newStatus;
      order.timelineJson = JSON.stringify(timeline);

      return await entityManager.save(Order, order);
    });

    // If order was cancelled, evict cache to reflect restored stock levels
    if (newStatus === 'Cancelled') {
      await this.productService.evictCache();
    }

    return result;
  }
}
