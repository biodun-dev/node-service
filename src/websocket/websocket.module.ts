import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketAuthService } from './websocket-auth';


import { RedisModule } from '../redis/redis.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [RedisModule, UtilsModule],
  providers: [
    WebsocketGateway, 
    WebsocketAuthService, 

  ],
  exports: [WebsocketGateway], 
})
export class WebsocketModule {}
