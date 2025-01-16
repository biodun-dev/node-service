import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../utils/logger.service';
import { Socket } from 'socket.io';

@Injectable()
export class WebsocketAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async authenticate(client: Socket): Promise<number | null> {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) throw new WsException('Authentication token missing');

      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, secret) as { user_id: number };

      if (!decoded.user_id) throw new WsException('Invalid token');

      client.data.userId = decoded.user_id;
      await this.redisService.set(`online_user:${decoded.user_id}`, 'true', 3600);
      return decoded.user_id;
    } catch (error) {
      this.logger.error(`❌ WebSocket authentication failed: ${error.message}`);
      client.disconnect();
      return null;
    }
  }
}
