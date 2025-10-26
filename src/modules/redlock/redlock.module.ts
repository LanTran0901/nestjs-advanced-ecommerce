import { Module, Global } from '@nestjs/common';
import Redlock from 'redlock';
import { RedisService } from 'src/db/redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDLOCK',
      inject: [RedisService],
      useFactory: (redis: RedisService) => {
         const redisClient = redis.getClient();
        const redlock = new Redlock([redisClient], {
          retryCount: 5,
          retryDelay: 200,
        });

        redlock.on('clientError', (err) => {
          console.error('🔴 A Redis client error has occurred:', err);
        });

        return redlock;
      },
    },
  ],
  exports: ['REDLOCK'],
})
export class RedlockModule {}
