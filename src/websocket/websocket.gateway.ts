import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../utils/logger.service';
import { WebsocketAuthService } from './websocket-auth';
import { WebsocketMessagesService } from './websocket-messages';
import { WebsocketBetService } from './websocket-bet';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: true })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: LoggerService,
    private readonly websocketAuthService: WebsocketAuthService,
    private readonly websocketMessagesService: WebsocketMessagesService,
    private readonly websocketBetService: WebsocketBetService,
    private readonly redisService: RedisService
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.websocketAuthService.authenticate(client);
    if (!userId) return;

    this.logger.log(`✅ User ${userId} connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      await this.redisService.delete(`online_user:${client.data.userId}`);
      this.logger.log(`❌ User ${client.data.userId} disconnected: ${client.id}`);
    }
  }

  async onModuleInit() {
    this.logger.log('WebSocket Gateway Initialized');
    this.websocketMessagesService.subscribeToLeaderboardUpdates(this.server);
    this.websocketBetService.subscribeToBetEvents(this.server); // ✅ Subscribe to bet events
  }
}
