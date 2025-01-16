import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [RedisModule, UtilsModule],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
