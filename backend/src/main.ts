import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { SentryExceptionFilter } from './sentry-exception.filter';

// Initialize Sentry before bootstrapping the app
Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://a6b61882df6a23be699d7990ff5d6a89@o4507000000000000.ingest.us.sentry.io/4507000000000000',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Enable global validation DTO pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Apply Sentry Global Exception Filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  // Configure Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('AI Customer Feedback Sentiment Intelligence Platform')
    .setDescription(
      'API documentation for customer feedback uploads, real-time metrics, Socket.IO updates, and Gemini AI analysis.',
    )
    .setVersion('1.0.0')
    .addTag('Feedback')
    .addTag('Analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  logger.log(`=======================================================`);
  logger.log(` NestJS Backend Server running on port: ${port}`);
  logger.log(` Swagger documentation available at: http://localhost:${port}/api/docs`);
  logger.log(` Realtime Socket.IO gateway running on: ws://localhost:${port}`);
  logger.log(`=======================================================`);
}

bootstrap();
