import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../utils/logger.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: true })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) throw new WsException('Authentication token missing');

      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, secret) as { user_id: number };

      if (!decoded.user_id) throw new WsException('Invalid token');

      client.data.userId = decoded.user_id;
      await this.redisService.set(`online_user:${decoded.user_id}`, 'true', 3600); // Store active users in Redis

      this.logger.log(`✅ User ${decoded.user_id} connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ WebSocket authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      await this.redisService.delete(`online_user:${client.data.userId}`);
      this.logger.log(`❌ User ${client.data.userId} disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: { channel: string; message: string }, @ConnectedSocket() client: Socket) {
    if (!client.data.userId) throw new WsException('Unauthorized user');

    this.logger.log(`Received message from User ${client.data.userId}: ${data.message} on channel: ${data.channel}`);

    // Publish message to Redis for other instances
    await this.redisService.publish(data.channel, JSON.stringify({ userId: client.data.userId, message: data.message }));

    // Broadcast message to all connected WebSocket clients
    this.server.emit(data.channel, { userId: client.data.userId, message: data.message });
  }

  // 🏆 Leaderboard Updates - Subscribe to leaderboard changes
  async onModuleInit() {
    this.logger.log('WebSocket Gateway Initialized');
    this.subscribeToLeaderboardUpdates();
  }

  async subscribeToLeaderboardUpdates() {
    await this.redisService.subscribe('leaderboard_updated', async () => {
      const leaderboard = await this.redisService.get('leaderboard_top_10');
      this.logger.log(`🔄 Leaderboard updated: ${leaderboard}`);
      this.server.emit('leaderboard_update', JSON.parse(leaderboard || '[]'));
    });
  }

  @SubscribeMessage('get_leaderboard')
  async sendLeaderboardToClient(@ConnectedSocket() client: Socket) {
    const leaderboard = await this.redisService.get('leaderboard_top_10');
    return JSON.parse(leaderboard || '[]');
  }
}
