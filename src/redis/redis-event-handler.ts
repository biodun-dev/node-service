import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserRedisService } from './user.redis';
import { BetRedisService } from './bet.redis';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class RedisEventHandler implements OnModuleInit {
  constructor(
    private readonly userRedisService: UserRedisService,
    private readonly betRedisService: BetRedisService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit() {
    this.logger.log('Redis Event Handler Initialized');
  }
}
