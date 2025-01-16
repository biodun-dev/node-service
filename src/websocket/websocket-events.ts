import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class WebsocketEventsService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async subscribeToEventUpdates(server: Server) {
    this.logger.log('📡 Subscribing to Event WebSocket Updates');

    // Listen for event creation
    await this.redisService.subscribe('event_created', (message) => {
      const event = JSON.parse(message);
      this.logger.log(`📢 Broadcasting New Event: ${event.name}`);
      server.emit('event_created', event);
    });

    // Listen for event updates
    await this.redisService.subscribe('event_updated', (message) => {
      const event = JSON.parse(message);
      this.logger.log(`📢 Broadcasting Event Update: ${event.name}`);
      server.emit('event_updated', event);
    });

    // Listen for event deletions
    await this.redisService.subscribe('event_deleted', (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`📢 Broadcasting Event Deletion: ${id}`);
      server.emit('event_deleted', { id });
    });
  }
}
