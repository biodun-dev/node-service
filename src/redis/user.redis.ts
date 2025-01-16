import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class UserRedisService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit() {
    this.logger.log('UserRedisService Initialized');
    this.listenForUserEvents();
  }

  private async listenForUserEvents() {
    await this.redisService.subscribe('user_created', async (message) => {
      const user = JSON.parse(message);
      this.logger.log(`✅ User Created: ${user.email}`);
      await this.redisService.set(`user:${user.id}`, JSON.stringify(user), 1800);
    });

    await this.redisService.subscribe('user_updated', async (message) => {
      const user = JSON.parse(message);
      this.logger.log(`🔄 User Updated: ${user.email}`);
      await this.redisService.set(`user:${user.id}`, JSON.stringify(user), 1800);
    });

    await this.redisService.subscribe('user_deleted', async (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`❌ User Deleted: ${id}`);
      await this.redisService.delete(`user:${id}`);
    });
  }
}
