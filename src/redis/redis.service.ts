import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.subscriber = new Redis(this.client.options); // Separate subscriber connection

    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis Error:', err.message));
    
    this.subscriber.on('connect', () => this.logger.log('Redis Subscriber Connected'));
    this.subscriber.on('error', (err) => this.logger.error('Redis Subscriber Error:', err.message));
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
      this.subscriber.subscribe(channel);
      this.subscriber.on('message', (_, message) => {
        this.logger.log(`Redis SUBSCRIBE: ${channel} -> ${message}`);
        callback(message);
      });
    } catch (err) {
      this.logger.error(`Redis SUBSCRIBE Error: ${channel}`, err.message);
    }
  }

  // Listen for new users from Rails
  async listenForUserEvents() {
    await this.subscribe('user_created', async (message) => {
      const user = JSON.parse(message);
      this.logger.log(`✅ New user received from Rails: ${user.email}`);
      await this.set(`user:${user.id}`, JSON.stringify(user), 3600);
    });

    await this.subscribe('user_updated', async (message) => {
      const user = JSON.parse(message);
      this.logger.log(`🔄 User updated from Rails: ${user.email}`);
      await this.set(`user:${user.id}`, JSON.stringify(user), 3600);
    });

    await this.subscribe('user_deleted', async (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`❌ User deleted from Rails: ${id}`);
      await this.delete(`user:${id}`);
    });
  }

  // 🏆 Listen for leaderboard updates from Rails
  async listenForLeaderboardUpdates() {
    await this.subscribe('leaderboard_updated', async () => {
      const leaderboard = await this.get('leaderboard_top_10');
      this.logger.log(`🔄 Leaderboard updated: ${leaderboard}`);
    });
  }

  onModuleDestroy() {
    this.client.quit();
    this.subscriber.quit();
    this.logger.log('RedisService connections closed');
  }

  onModuleInit() {
    this.logger.log('RedisService Initialized');
    this.listenForUserEvents(); // Start listening for user events
    this.listenForLeaderboardUpdates(); // Start listening for leaderboard updates
  }
}
