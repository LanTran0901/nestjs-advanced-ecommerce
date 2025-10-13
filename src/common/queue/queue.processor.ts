import { Processor, WorkerHost} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/db/prisma.service';

interface CancelOrderJobData {
  orderId: number;
  userId: number;
  reason?: string;
}

@Processor('order-queue') 
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);
  
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  
  async process(job: Job<any, any, string>) {
    this.logger.log(`Processing job: ${job.id}, Type: ${job.name}`);
    
    try {
      switch (job.name) {
        case 'cancelOrder':
          return await this.handleCancelOrder(job as Job<CancelOrderJobData>);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, message: `Unknown job type: ${job.name}` };
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error; 
    }
  }

  private async handleCancelOrder(job: Job<CancelOrderJobData>) {
    const { orderId, userId, reason } = job.data;
    
    this.logger.log(`Auto-cancelling order ${orderId} for user ${userId}. Reason: ${reason || 'Payment timeout'}`);
    
    return await this.prisma.$transaction(async (prisma) => {
     
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          deletedAt: null,
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              skuId: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found or already deleted`);
        return { success: false, message: 'Order not found' };
      }

      // Only cancel if order is still in PENDING_PAYMENT status
      if (order.status !== 'PENDING_PAYMENT') {
        this.logger.warn(`Order ${orderId} cannot be auto-cancelled. Current status: ${order.status}`);
        return { success: false, message: `Order status is ${order.status}, cannot auto-cancel` };
      }

      // Update order status to CANCELLED
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedById: userId,
        },
      });

      // Restore inventory for all order items
      await Promise.all(
        order.items.map(async (item) => {
          if (item.skuId) {
            await prisma.sKU.update({
              where: { id: item.skuId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        })
      );

    
      
      return { 
        message: 'Order auto-cancelled successfully due to payment timeout',
        orderId,
        restoredItems: order.items.length,
      };
    });
  }
}
