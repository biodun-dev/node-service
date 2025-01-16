import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class WebsocketBetService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async subscribeToBetEvents(server: Server) {
    // Listen for bet creation
    await this.redisService.subscribe('bet_created', async (message) => {
      const bet = JSON.parse(message);
      this.logger.log(`🎲 New Bet Placed: ${bet.id} - Amount: ${bet.amount}`);
      server.emit('bet_created', bet);
    });

    // Listen for bet updates
    await this.redisService.subscribe('bet_updated', async (message) => {
      const bet = JSON.parse(message);
      this.logger.log(`🔄 Bet Updated: ${bet.id} - Status: ${bet.status}`);
      server.emit('bet_updated', bet);
    });

    // Listen for bet deletions
    await this.redisService.subscribe('bet_deleted', async (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`❌ Bet Deleted: ${id}`);
      server.emit('bet_deleted', { id });
    });
  }
}
