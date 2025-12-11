import { H } from '@highlight-run/node';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

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
  // Create app WITHOUT body parser first
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Preserve raw body for Stripe webhook signature verification
    bodyParser: false, // Disable default body parser - we'll configure it manually
  });

  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // CRITICAL: Apply express.raw() for webhook routes FIRST (before JSON parser)
  // According to Stripe docs: webhook route must be registered BEFORE express.json()
  // This ensures raw body is preserved for signature verification
  const webhookPaths = ['/subscriptions/webhooks/stripe', '/subscriptions/webhooks/llamapay'];

  webhookPaths.forEach((path) => {
    expressApp.use(path, express.raw({ type: 'application/json', limit: '10mb' }));
  });

  // Now apply JSON body parser for all OTHER routes (after webhook routes)
  // This follows Stripe's recommendation: webhook route before express.json()
  expressApp.use(express.json({ limit: '10mb' }));

  // Log configuration
  console.log('✅ Webhook endpoints configured to preserve raw body for signature verification');
  console.log(`   Webhook paths (raw body): ${webhookPaths.join(', ')}`);
  console.log('   Other routes: JSON body parser enabled');

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
      'https://bulwark-admin.blockapex.online',
      'https://bulwark-admin-staging.blockapex.online',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
