import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../utils/logger.service';
import { WebsocketAuthService } from './websocket-auth';
import { RedisService } from '../redis/redis.service';

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

  private isSubscribed = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly websocketAuthService: WebsocketAuthService,
    private readonly redisService: RedisService
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`New connection attempt: ${client.id} from ${client.handshake.address}`);

    const userId = await this.websocketAuthService.authenticate(client);
    
    if (!userId) {
      this.logger.warn(`Unauthorized connection: ${client.id} disconnected.`);
      client.disconnect();
      return;
    }

    this.logger.log(`User authenticated: ${userId} | Socket ID: ${client.id}`);

    const isOnline = await this.redisService.get(`online_user:${userId}`);
    if (!isOnline) {
      await this.redisService.set(`online_user:${userId}`, 'true', 3600);
      this.logger.log(`User ${userId} connected and marked online.`);
    } else {
      this.logger.log(`User ${userId} reconnected.`);
    }

    this.logger.log(`Active connections: ${(await this.server.fetchSockets()).length}`);
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

  async onModuleInit() {
    if (this.isSubscribed) {
      this.logger.warn('WebSocket Gateway already initialized. Skipping duplicate subscriptions.');
      return;
    }

    this.isSubscribed = true;
    this.logger.log('WebSocket Gateway Initialized');
    await this.subscribeToRedisEvents();
  }
  async subscribeToRedisEvents() {
    this.logger.log("Starting Redis event subscriptions");
  
    const eventsToSubscribe = [
      "bet_created",
      "bet_updated",
      "bet_deleted",
      "bet_winning_updated",
      "event_created",
      "event_updated",
      "event_deleted",
      "leaderboard_update"
    ];
  
    for (const eventType of eventsToSubscribe) {
      await this.redisService.subscribe(eventType, async (message) => {
        const parsedMessage = JSON.parse(message);
        this.logger.log(`🔹 Redis MESSAGE Received | Channel: ${eventType} | Message: ${JSON.stringify(parsedMessage)}`);
  
        // Get total connected WebSocket clients before broadcasting
        const clients = await this.server.fetchSockets();
        this.logger.log(`🔹 Total WebSocket Clients before emit: ${clients.length}`);
  
        if (clients.length === 0) {
          this.logger.warn(`⚠️ No active WebSocket clients! Event '${eventType}' won't reach anyone.`);
        }
  
        // 🔥 Broadcast the event to all connected WebSocket clients
        this.server.emit(eventType, parsedMessage);
        this.logger.log(`✅ WebSocket Event '${eventType}' emitted to ${clients.length} clients.`);
      });
    }
  
    this.logger.log("✅ Finished subscribing to Redis events");
  }
  
  
}
