import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { UserRedisService } from './user.redis';
import { BetRedisService } from './bet.redis';
import { EventRedisService } from './event.redis'; 
import { RedisEventHandler } from './redis-event-handler';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [ConfigModule, UtilsModule],
  providers: [RedisService, UserRedisService, BetRedisService, EventRedisService, RedisEventHandler],
  exports: [RedisService, UserRedisService, BetRedisService, EventRedisService, RedisEventHandler],
})
export class RedisModule {}
