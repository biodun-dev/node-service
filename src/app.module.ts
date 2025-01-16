import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { UtilsModule } from './utils/utils.module';
import { MiddlewaresModule } from './middlewares/middlewares.module';
import { ConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [EventsModule, UtilsModule, MiddlewaresModule, ConfigModule, RedisModule, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
