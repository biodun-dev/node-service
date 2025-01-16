import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',  // Allow all origins or replace with specific URLs like 'http://localhost:5000'
    credentials: true,  // Allow credentials (cookies, Authorization header)
  });

  const config = new DocumentBuilder()
    .setTitle('Node Service API')
    .setDescription('API documentation for the NestJS service')
    .setVersion('1.0')
    .addTag('WebSockets')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);

  logger.log(`NestJS API running on http://localhost:${PORT}`);
  logger.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
}

bootstrap();
