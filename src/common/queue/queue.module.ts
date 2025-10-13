// queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { env } from 'src/utils/config';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        username: 'default',
        password: env.REDIS_PASSWORD,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      }
    }),
    BullModule.registerQueue({
      name: 'order-queue', 
    }),
  ],
  providers: [QueueService, QueueProcessor,PrismaService],
  exports: [QueueService],
})
export class QueueModule {}
