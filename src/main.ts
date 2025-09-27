/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'Video Processor API'))
    .setDescription(
      configService.get(
        'SWAGGER_DESCRIPTION',
        'API for processing videos and extracting frames',
      ),
    )
    .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
    .addTag('Video Processing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Video Processor API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.2/swagger-ui-bundle.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.2/swagger-ui.min.css',
    ],
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🎬 Video Processor API started on port ${port}`);
  logger.log(
    `📖 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
  logger.log(`🔗 API endpoint: http://localhost:${port}/${apiPrefix}`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start', error);
  process.exit(1);
});
