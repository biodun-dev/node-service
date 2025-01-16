import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
            const type = 'postgres'; // should always be 'postgres' if you’re using PostgreSQL
            const host = configService.get<string>('DB_HOST', 'localhost');
            const port = configService.get<number>('DB_PORT', 5432);
            const username = configService.get<string>('DB_USER', 'postgres');
            const password = configService.get<string>('DB_PASSWORD', 'password');
            const database = configService.get<string>('DB_NAME', 'mydb');
            return {
              type,
              host,
              port,
              username,
              password,
              database,
              autoLoadEntities: true,
              synchronize: true,
            };
          }
          
      }),
    ],
  })
  export class AppConfigModule {}
  
