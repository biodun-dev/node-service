import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../utils/logger.service';
import { WebsocketAuthService } from './websocket-auth';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"]
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: LoggerService,
    private readonly websocketAuthService: WebsocketAuthService,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit() {
    this.logger.log('WebSocket Gateway Initialized');
    
    // ✅ Pass WebSocket Server to RedisService
    this.redisService.setWebSocketServer(this.server);

    await this.redisService.subscribeToAllEvents();
  }

  async handleConnection(client: Socket) {
    this.logger.log(`New connection attempt: ${client.id} from ${client.handshake.address}`);
  
    const userId = await this.websocketAuthService.authenticate(client);
    
    if (!userId) {
      this.logger.warn(`Unauthorized connection: ${client.id} disconnected.`);
      client.disconnect();
      return;
    }
  
    this.logger.log(`User authenticated: ${userId} | Socket ID: ${client.id}`);
  
    const leaderboardData = await this.redisService.get(`leaderboard:${userId}`);
    if (leaderboardData) {
      client.emit('leaderboard_updated', JSON.parse(leaderboardData));
      this.logger.log(`Sent cached leaderboard data to ${userId}`);
    }
  }
  

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      const clients = await this.server.fetchSockets();
      const userStillConnected = clients.some(c => c.data.userId === client.data.userId);

      if (!userStillConnected) {
        await this.redisService.delete(`online_user:${client.data.userId}`);
        this.logger.log(`User ${client.data.userId} disconnected and removed from Redis.`);
      } else {
        this.logger.log(`User ${client.data.userId} disconnected but still has active connections.`);
      }
    }
    this.logger.log(`Active connections after disconnect: ${(await this.server.fetchSockets()).length}`);
  }
}
