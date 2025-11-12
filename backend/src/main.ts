import { H } from '@highlight-run/node';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Initialize Highlight.io for error tracking
if (process.env.HIGHLIGHT_PROJECT_ID) {
  H.init({
    projectID: process.env.HIGHLIGHT_PROJECT_ID,
    serviceName: 'bulwark-backend',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
  console.log('✅ Highlight.io initialized for error tracking');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Bulwark API')
    .setDescription('The Bulwark API description')
    .setVersion('1.0')
    .addTag('bulwark')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://my-security-ivory.vercel.app',
      'https://bulwark.blockapex.io',
      'https://bulwark-staging.blockapex.io',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
