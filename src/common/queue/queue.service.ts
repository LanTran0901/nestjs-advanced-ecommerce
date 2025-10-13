// queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

interface CancelOrderJobData {
  orderId: number;
  userId: number;
  reason?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('order-queue') private readonly queue: Queue) {}

  async addCancelOrderJob(data: CancelOrderJobData, delayInSeconds: number = 86400) { // 24 hours = 86400 seconds
    try {
      const job = await this.queue.add('cancelOrder', data, {
        delay: delayInSeconds * 1000,
      });

      this.logger.log(`Added cancel order job: ${job.id} for order: ${data.orderId}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add cancel order job:', error);
      throw error;
    }
  }

 
}
