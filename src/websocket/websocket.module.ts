import { Module } from '@nestjs/common';
import { WebsocketController } from './websocket.controller';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  controllers: [WebsocketController],
  providers: [WebsocketGateway]
})
export class WebsocketModule {}
