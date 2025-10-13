import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreatePaymentReceiverDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  
  constructor(private prisma: PrismaService) {}
  
  calculateTotal(orders: any[]) {
    return orders.reduce((acc, item) => (item.totalPrice + acc), 0);
  }
  
  async createPaymentReceiver(createPaymentReceiverDto: CreatePaymentReceiverDto) {
    const { 
      code, 
      gateway, 
      accountNumber, 
      transferAmount, 
      transactionDate,
      subAccount,
      content,
      transferType,
      accumulated,
      referenceCode,
      description
    } = createPaymentReceiverDto;

    // Only process incoming transfers
    if (transferType !== 'in') {
      this.logger.warn(`Ignoring outgoing transaction: ${transferType}`);
      return {
        message: 'Outgoing transaction ignored',
        data: { transferType },
      };
    }

    if (!code) {
      throw new BadRequestException('Transaction code is required');
    }

    const paymentId = parseInt(content.split('DH')[1] || '');
    if (!paymentId || isNaN(paymentId)) {
      throw new BadRequestException('Invalid transaction code format. Expected: DH{paymentId}');
    }

    return await this.prisma.$transaction(async (prisma) => {
      
      await prisma.paymentTransaction.create({
        data: {
          gateway,
          transactionDate: new Date(transactionDate),
          accountNumber,
          subAccount,
          amountIn: Math.round(transferAmount),
          amountOut: 0,
          accumulated: Math.round(accumulated),
          code,
          transactionContent: content,
          referenceNumber: referenceCode,
          body: description,
        }
      });

      // Find payment with orders
      const foundPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          orders: {
            where: { deletedAt: null }
          }
        }
      });

      if (!foundPayment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      if (foundPayment.orders.length === 0) {
        throw new BadRequestException(`No orders found for payment ${paymentId}`);
      }

      // Calculate total amount
      const total = this.calculateTotal(foundPayment.orders);
      
      // Validate payment amount
      if (total > transferAmount) {
        throw new BadRequestException(
          `Payment amount insufficient. Required: ${total}, Received: ${transferAmount}`
        );
      }

      await Promise.all([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'SUCCESS' }
        }),
        prisma.order.updateMany({
          where: { 
            paymentId: paymentId,
            deletedAt: null
          },
          data: { status: 'PENDING_PICKUP' }
        })
      ]);

      return {
        message: 'Payment processed successfully',
        data: {
          paymentId,
          totalAmount: total,
          receivedAmount: transferAmount,
          ordersCount: foundPayment.orders.length,
        },
      };
    });
  }
}