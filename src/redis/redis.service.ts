import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { LoggerService } from '../utils/logger.service';
import { Server } from 'socket.io';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private subscribedChannels: Set<string> = new Set();
  private handlers: Map<string, (message: string) => void> = new Map();
  private websocketServer: Server | null = null; 

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.subscriber = new Redis(this.client.options);

    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis Error:', err.message));

    this.subscriber.on('connect', () => this.logger.log('Redis Subscriber Connected'));
    this.subscriber.on('error', (err) => this.logger.error('Redis Subscriber Error:', err.message));

    this.subscriber.on('message', (channel, message) => {
      this.logger.log(`Redis MESSAGE Received | Channel: ${channel} | Message: ${message}`);

      if (this.handlers.has(channel)) {
        this.handlers.get(channel)?.(message);
      }

      
      if (this.websocketServer) {
        this.websocketServer.emit(channel, JSON.parse(message));
        this.logger.log(`WebSocket Broadcast: ${channel} -> ${message}`);
      }
    });
  }

  setWebSocketServer(server: Server) {
    this.websocketServer = server;
  }

  async set(key: string, value: string, expire?: number): Promise<void> {
    try {
      if (expire) {
        await this.client.set(key, value, 'EX', expire);
      } else {
        await this.client.set(key, value);
      }
      this.logger.log(`Redis SET: ${key}`);
    } catch (err) {
      this.logger.error(`Redis SET Error: ${key}`, err.message);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      this.logger.log(`Redis GET: ${key}`);
      return value;
    } catch (err) {
      this.logger.error(`Redis GET Error: ${key}`, err.message);
      return null;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      this.logger.log(`Redis DEL: ${key}`);
      return result;
    } catch (err) {
      this.logger.error(`Redis DEL Error: ${key}`, err.message);
      return 0;
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    try {
      const result = await this.client.publish(channel, message);
      this.logger.log(`Redis PUBLISH: ${channel} -> ${message}`);
      return result;
    } catch (err) {
      this.logger.error(`Redis PUBLISH Error: ${channel}`, err.message);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      if (this.subscribedChannels.has(channel)) {
        this.logger.warn(`Already subscribed to Redis channel: ${channel}. Skipping duplicate subscription.`);
        return;
      }

      this.subscribedChannels.add(channel);
      this.handlers.set(channel, callback);
      await this.subscriber.subscribe(channel);
      this.logger.log(`Subscribed to Redis channel: ${channel}`);
    } catch (err) {
      this.logger.error(`Redis SUBSCRIBE Error: ${channel}`, err.message);
    }
  }

  async subscribeToAllEvents() {
    this.logger.log('Starting Redis event subscriptions');

    await this.subscribe('bet_created', async (message) => {
      this.logger.log(`Processing bet_created: ${message}`);
      const bet = JSON.parse(message);
      if (!bet.id || !bet.amount) {
        this.logger.warn(`Invalid bet_created event received: ${message}`);
        return;
      }
      this.logger.log(`New Bet Placed: ${bet.id} - Amount: ${bet.amount}`);
      await this.set(`bet:${bet.id}`, JSON.stringify(bet), 3600);
    });

    await this.subscribe('event_created', async (message) => {
      this.logger.log(`Processing event_created: ${message}`);
      const event = JSON.parse(message);
      if (!event.id || !event.name) {
        this.logger.warn(`Invalid event_created event received: ${message}`);
        return;
      }
      this.logger.log(`New Event Created: ${event.name}`);
      await this.set(`event:${event.id}`, JSON.stringify(event), 3600);
    });

    await this.subscribe('bet_updated', async (message) => {
      this.logger.log(`Processing bet_updated: ${message}`);
      const bet = JSON.parse(message);
      this.logger.log(`Bet Updated: ${bet.id} - Status: ${bet.status}`);
      await this.set(`bet:${bet.id}`, JSON.stringify(bet), 3600);
    });

    await this.subscribe('event_updated', async (message) => {
      this.logger.log(`Processing event_updated: ${message}`);
      const event = JSON.parse(message);
      this.logger.log(`Event Updated: ${event.name} - Status: ${event.status}`);
      await this.set(`event:${event.id}`, JSON.stringify(event), 3600);
    });

    await this.subscribe('bet_deleted', async (message) => {
      this.logger.log(`Processing bet_deleted: ${message}`);
      const { id } = JSON.parse(message);
      this.logger.log(`Bet Deleted: ${id}`);
      await this.delete(`bet:${id}`);
    });

    await this.subscribe('event_deleted', async (message) => {
      this.logger.log(`Processing event_deleted: ${message}`);
      const { id } = JSON.parse(message);
      this.logger.log(`Event Deleted: ${id}`);
      await this.delete(`event:${id}`);
    });

    await this.subscribe('user_created', async (message) => {
      this.logger.log(`Processing user_created: ${message}`);
      const user = JSON.parse(message);
      this.logger.log(`User Created: ${user.email}`);
      await this.set(`user:${user.id}`, JSON.stringify(user), 1800);
    });

    await this.subscribe('leaderboard_updated', async (message) => {
      this.logger.log(`Processing leaderboard_updated: ${message}`);
      const leaderboard = JSON.parse(message);
    
      if (!leaderboard.user_id || leaderboard.total_winnings === undefined) {
        this.logger.warn(`Invalid leaderboard_updated event received: ${message}`);
        return;
      }
    
      this.logger.log(`Leaderboard Updated: User ${leaderboard.user_id} - Total Winnings: ${leaderboard.total_winnings}`);
    
      await this.set(`leaderboard:${leaderboard.user_id}`, JSON.stringify(leaderboard), 3600);
    
      if (this.websocketServer) {
        this.websocketServer.emit('leaderboard_updated', leaderboard);
        this.logger.log(`WebSocket Broadcast: leaderboard_updated -> ${message}`);
      } else {
        this.logger.warn("WebSocket server not initialized. Cannot broadcast leaderboard update.");
      }
    });
    
    

    this.logger.log('Finished subscribing to all Redis events');
  }

  onModuleInit() {
    this.logger.log('RedisService Initialized');
    this.subscribeToAllEvents();
  }

  onModuleDestroy() {
    this.client.quit();
    this.subscriber.quit();
    this.logger.log('RedisService connections closed');
  }
}
