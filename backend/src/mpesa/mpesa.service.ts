import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from '../entities/Order.entity';
import { OrderService } from '../order/order.service';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
  ) {}

  // Formatting Kenyan phone numbers into Safaricom standard (2547XXXXXXXX or 2541XXXXXXXX)
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    } else if (phone.startsWith('+')) {
      cleaned = phone.replace('+', '');
    }
    
    if (!/^254[71]\d{8}$/.test(cleaned)) {
      throw new BadRequestException(`Invalid Safaricom phone number format: ${phone}. Must be a valid Kenyan mobile number.`);
    }
    return cleaned;
  }

  // Generates OAuth token from Safaricom API
  private async getOAuthToken(): Promise<string> {
    const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET');
    const apiBase = this.configService.get<string>('MPESA_API_URL') || 'https://sandbox.safaricom.co.ke';

    if (!consumerKey || !consumerSecret || consumerKey.includes('your_') || consumerSecret.includes('your_')) {
      throw new Error('M-Pesa Consumer Credentials not configured.');
    }

    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    try {
      const response = await fetch(
        `${apiBase}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Safaricom OAuth request failed: ${errorText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      this.logger.error('Failed to retrieve Safaricom OAuth token', error.stack);
      throw error;
    }
  }

  // Triggers real STK Push or falls back to simulation mode
  async triggerStkPush(orderId: string, customPhone?: string): Promise<any> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    // Verify order is actually pending payment
    if (order.status !== 'Pending Payment') {
      throw new BadRequestException(`Cannot initiate payment for order in status: ${order.status}`);
    }

    // Verify order ownership - prevent triggering STK push to arbitrary phone numbers
    if (customPhone && order.phone !== customPhone) {
      throw new BadRequestException('Access Denied: STK Push phone number must match the order phone number.');
    }

    const rawPhone = customPhone || order.phone;
    const formattedPhone = this.formatPhoneNumber(rawPhone);
    const amount = Math.round(order.totalAmount);
    const apiBase = this.configService.get<string>('MPESA_API_URL') || 'https://sandbox.safaricom.co.ke';

    try {
      // 1. Fetch access token
      const accessToken = await this.getOAuthToken();

      // 2. Setup constants
      const shortCode = this.configService.get<string>('MPESA_SHORTCODE') || '174379';
      const passKey = this.configService.get<string>('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

      if (!callbackUrl) {
        throw new Error('MPESA_CALLBACK_URL is not defined in environment variables.');
      }

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: order.id,
        TransactionDesc: `Sportman Order Payment ${order.id}`,
      };

      this.logger.log(`Initiating Safaricom STK Push for Order: ${order.id} to Phone: ${formattedPhone}`);
      const response = await fetch(
        `${apiBase}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Safaricom STK Push failed: ${errorText}`);
      }

      const data = await response.json();
      
      // Update order with the checkout request id
      order.mpesaCheckoutRequestId = data.CheckoutRequestID;
      await this.orderRepository.save(order);

      this.logger.log(`STK Push initiated successfully: ${data.CheckoutRequestID}`);
      return {
        success: true,
        message: 'STK Push prompt sent successfully to handset.',
        checkoutRequestId: data.CheckoutRequestID,
      };

    } catch (error) {
      this.logger.error(`Safaricom Daraja API failed. Payment cannot proceed. Error: ${error.message}`);
      throw new BadRequestException(`Payment initialization failed: ${error.message}`);
    }
  }

  // Handles payment notification from Safaricom callback URL
  async handleCallback(body: any): Promise<any> {
    this.logger.log('Received M-Pesa Callback Notification payload from Safaricom');

    const callbackData = body?.Body?.stkCallback;
    if (!callbackData) {
      throw new BadRequestException('Invalid M-Pesa Callback Payload structure.');
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = callbackData;
    this.logger.log(`Processing callback for CheckoutRequestID: ${CheckoutRequestID} | ResultCode: ${ResultCode}`);

    const order = await this.orderRepository.findOne({ where: { mpesaCheckoutRequestId: CheckoutRequestID } });
    if (!order) {
      this.logger.warn(`No order found associated with CheckoutRequestID: ${CheckoutRequestID}`);
      return { success: false, message: 'No matching checkout request found.' };
    }

    if (ResultCode === 0) {
      // Extract Callback Metadata
      const metadataItems = callbackData.CallbackMetadata?.Item || [];
      const mpesaReceiptItem = metadataItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const mpesaReference = mpesaReceiptItem?.Value || 'MPESA' + Math.random().toString(36).substring(2, 8).toUpperCase();

      this.logger.log(`Order ${order.id} successfully PAID via M-Pesa. Receipt: ${mpesaReference}`);
      await this.orderService.updateStatus(order.id, 'Paid', { mpesaReference });
      return { success: true, orderId: order.id, status: 'Paid' };
    } else {
      this.logger.warn(`Order ${order.id} payment failed or cancelled. Safaricom Desc: ${ResultDesc}`);
      // Mark as Cancelled or log failure. To preserve user checkout flow we just log it and can keep it as Pending Payment or Cancelled
      await this.orderService.updateStatus(order.id, 'Cancelled', { reason: `M-Pesa payment failed: ${ResultDesc}` });
      return { success: false, orderId: order.id, status: 'Failed', reason: ResultDesc };
    }
  }
}
