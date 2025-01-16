import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class WebsocketMessagesService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async subscribeToLeaderboardUpdates(server: Server) {
    await this.redisService.subscribe('leaderboard_updated', async () => {
      const leaderboard = await this.redisService.get('leaderboard_top_10');
      this.logger.log(`🔄 Leaderboard updated: ${leaderboard}`);
      server.emit('leaderboard_update', JSON.parse(leaderboard || '[]'));
    });
  }
}
