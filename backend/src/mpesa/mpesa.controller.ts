import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MpesaService } from './mpesa.service';

@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  // Expose STK push trigger endpoint
  @Post('stkpush')
  @HttpCode(HttpStatus.OK)
  async triggerStkPush(@Body() body: { orderId: string; phone?: string }) {
    return this.mpesaService.triggerStkPush(body.orderId, body.phone);
  }

  // Safaricom Daraja callback endpoint (Must be public, no authentication guards!)
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() body: any) {
    return this.mpesaService.handleCallback(body);
  }
}
