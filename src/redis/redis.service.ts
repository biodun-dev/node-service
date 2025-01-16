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

    this.subscriber = new Redis(this.client.options);

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

  onModuleDestroy() {
    this.client.quit();
    this.subscriber.quit();
    this.logger.log('RedisService connections closed');
  }

  onModuleInit() {
    this.logger.log('RedisService Initialized');
  }
}
