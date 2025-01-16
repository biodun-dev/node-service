import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { UtilsModule } from './utils/utils.module';
import { MiddlewaresModule } from './middlewares/middlewares.module';
import { AppConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    AppConfigModule, 
    TypeOrmModule.forRoot(),  
    EventsModule, 
    UtilsModule, 
    MiddlewaresModule, 
    RedisModule, 
    WebsocketModule, UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
