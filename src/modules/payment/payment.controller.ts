import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { CreatePaymentReceiverDto } from './dto/payment.dto';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Public()
  @UseGuards(ApiKeyGuard)
  @Post('receiver')
  async createPaymentReceiver(
    @Body(ZodValidationPipe) createPaymentReceiverDto: CreatePaymentReceiverDto
  ) {
    return this.paymentService.createPaymentReceiver(createPaymentReceiverDto);
  }
}