import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class EventRedisService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit() {
    this.logger.log('EventRedisService Initialized');
    this.listenForEventUpdates();
  }

  private async listenForEventUpdates() {
    await this.redisService.subscribe('event_created', async (message) => {
      const event = JSON.parse(message);
      this.logger.log(`🎟️ New Event Created: ${event.name}`);
      await this.redisService.set(`event:${event.id}`, JSON.stringify(event), 3600);
    });

    await this.redisService.subscribe('event_updated', async (message) => {
      const event = JSON.parse(message);
      this.logger.log(`🔄 Event Updated: ${event.name} - Status: ${event.status}`);
      await this.redisService.set(`event:${event.id}`, JSON.stringify(event), 3600);
    });

    await this.redisService.subscribe('event_deleted', async (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`❌ Event Deleted: ${id}`);
      await this.redisService.delete(`event:${id}`);
    });
  }
}
