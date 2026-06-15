import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets (such as uploaded product images)
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/public/',
  });

  // Use Helmet for secure HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Enable global validation piping
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  // Set API Global prefix
  app.setGlobalPrefix('api');

  // Lock down CORS to verified storefront domains and local development
  const allowedOrigins = [
    'http://localhost:5173',
    'https://sportman.ke',
    'https://admin.sportman.ke'
  ];

  app.enableCors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV !== 'production';
      if (
        !origin || 
        allowedOrigins.indexOf(origin) !== -1 ||
        (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))
      ) {
        callback(null, true);
      } else {
        console.warn(`🔒 CORS Blocked Origin: ${origin}`);
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Sportman.ke Full-Stack Server active on: http://localhost:${port}/api`);
}
bootstrap();
