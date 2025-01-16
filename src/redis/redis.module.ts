import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [ConfigModule, UtilsModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
