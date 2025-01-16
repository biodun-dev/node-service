import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketAuthService } from './websocket-auth';
import { WebsocketMessagesService } from './websocket-messages';
import { WebsocketBetService } from './websocket-bet';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [WebsocketGateway, WebsocketAuthService, WebsocketMessagesService, WebsocketBetService],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
