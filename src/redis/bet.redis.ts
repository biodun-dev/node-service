import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class BetRedisService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit() {
    this.logger.log('BetRedisService Initialized');
    this.listenForBetEvents();
  }

  private async listenForBetEvents() {
    await this.redisService.subscribe('bet_created', async (message) => {
      const bet = JSON.parse(message);
      this.logger.log(`🎲 New Bet Placed: ${bet.id} - Amount: ${bet.amount}`);
      await this.redisService.set(`bet:${bet.id}`, JSON.stringify(bet), 3600);
    });

    await this.redisService.subscribe('bet_updated', async (message) => {
      const bet = JSON.parse(message);
      this.logger.log(`🔄 Bet Updated: ${bet.id} - Status: ${bet.status}`);
      await this.redisService.set(`bet:${bet.id}`, JSON.stringify(bet), 3600);
    });

    await this.redisService.subscribe('bet_deleted', async (message) => {
      const { id } = JSON.parse(message);
      this.logger.log(`❌ Bet Deleted: ${id}`);
      await this.redisService.delete(`bet:${id}`);
    });

    await this.redisService.subscribe('bet_winning_updated', async (message) => {
      const { user_id, winnings } = JSON.parse(message);
      this.logger.log(`🏆 Bet Winning Updated for User ${user_id}: ${winnings}`);
      await this.redisService.set(`user_winnings:${user_id}`, winnings, 3600);
    });
  }
}
