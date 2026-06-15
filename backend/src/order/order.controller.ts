import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtService } from '@nestjs/jwt';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async createOrder(@Body() createDto: any) {
    return this.orderService.create(createDto);
  }

  // Admin and Staff can fetch all orders
  @Get()
  @UseGuards(AuthGuard)
  @Roles('admin', 'warehouse_staff', 'delivery_agent')
  async getAllOrders() {
    return this.orderService.findAll();
  }

  // Customers can fetch their own orders
  @Get('my-orders')
  @UseGuards(AuthGuard)
  async getMyOrders(@Req() req: any) {
    const user = req.user;
    return this.orderService.findByEmailOrPhone(user.email, user.phone);
  }

  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @Req() req: any,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    const isStaff = await this.checkIfStaff(req);
    if (isStaff) {
      return this.orderService.findById(id);
    }

    const order = await this.orderService.findById(id);
    if (!email && !phone) {
      throw new ForbiddenException('Access Denied: Verification required to view order details.');
    }
    if (email && order.email.toLowerCase() !== email.toLowerCase()) {
      throw new ForbiddenException('Access Denied: Email verification failed.');
    }
    if (phone && order.phone !== phone) {
      throw new ForbiddenException('Access Denied: Phone verification failed.');
    }
    return order;
  }

  // Public payment completion endpoint for Daraja STK Push sandbox simulator
  @Put(':id/pay')
  async payOrder(
    @Param('id') id: string,
    @Body() body: { mpesaReference: string }
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Access Denied: Manual payment simulation is disabled in production.');
    }
    return this.orderService.updateStatus(id, 'Paid', { mpesaReference: body.mpesaReference });
  }

  private async checkIfStaff(req: any): Promise<boolean> {
    let token = null;
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.split('=').map(c => c.trim());
        if (key && value) acc[key] = value;
        return acc;
      }, {});
      token = cookies['sm_token'];
    }

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) return false;

    try {
      const decoded = this.jwtService.verify(token);
      return ['admin', 'warehouse_staff', 'delivery_agent'].includes(decoded.role);
    } catch {
      return false;
    }
  }

  // Gated status updates enforcing strict role gates in the execution context
  @Put(':id/status')
  @UseGuards(AuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; extraData?: any },
    @Req() req: any
  ) {
    const userRole = req.user.role;
    const targetStatus = body.status;

    if (targetStatus === 'Approved' || targetStatus === 'Cancelled' || targetStatus === 'Paid') {
      // Only Admin can approve, cancel, or force-pay order states
      if (userRole !== 'admin') {
        throw new ForbiddenException('Access Denied: Only Admin can approve, cancel, or force-pay orders.');
      }
    } else if (targetStatus === 'Preparing' || targetStatus === 'Ready for Shipping') {
      // Only Warehouse personnel (or Admin override) can pick and pack orders
      if (userRole !== 'warehouse_staff' && userRole !== 'admin') {
        throw new ForbiddenException('Access Denied: Only Warehouse staff can pick and pack orders.');
      }
    } else if (targetStatus === 'Shipped' || targetStatus === 'Delivered') {
      // Only Delivery personnel (or Admin override) can ship and sign handover deliveries
      if (userRole !== 'delivery_agent' && userRole !== 'admin') {
        throw new ForbiddenException('Access Denied: Only Delivery couriers can ship and complete deliveries.');
      }
    } else {
      throw new BadRequestException(`Access Denied: Unknown status code target: ${targetStatus}`);
    }

    return this.orderService.updateStatus(id, targetStatus, body.extraData || {});
  }
}
