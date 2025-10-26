import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/db/prisma.service';
import { QueueModule } from 'src/common/queue/queue.module';
import { RedlockModule } from '../redlock/redlock.module';

@Module({
  imports: [QueueModule, RedlockModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}