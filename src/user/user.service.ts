import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redisService: RedisService
  ) {}

  async getAllUsers(): Promise<any[]> {
    return this.connection.query('SELECT * FROM users');
  }

  async findUserByEmail(email: string): Promise<any> {
    return this.connection.query('SELECT * FROM users WHERE email = $1', [email]);
  }

  async syncUserFromRails(user: any) {
    // Store user in Redis cache
    await this.redisService.set(`user:${user.id}`, JSON.stringify(user));
  }
}
