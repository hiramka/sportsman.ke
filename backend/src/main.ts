import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets (such as uploaded product images)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
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

  // Lock down CORS strictly to verified storefront domains in production
  const allowedOrigins = [
    'https://sportman.ke',
    'https://admin.sportman.ke'
  ];
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(item => item.trim());
    allowedOrigins.push(...envOrigins);
  }

  app.enableCors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        // Development mode: Allow localhost and local private network ranges
        if (
          !origin ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.')
        ) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy (Dev Mode)'));
        }
      } else {
        // Production mode: Strictly allow only registered domains (and same-origin/non-browser clients)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.warn(`🔒 CORS Blocked Origin: ${origin}`);
          callback(new Error('Blocked by CORS policy (Production Mode)'));
        }
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
