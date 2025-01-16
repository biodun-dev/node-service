import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Node Service API')
    .setDescription('API documentation for the NestJS service')
    .setVersion('1.0')
    .addTag('users') // Add more tags as needed
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('API documentation available at http://localhost:3000/api/docs');
}
bootstrap();
