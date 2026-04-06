import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SanitizerInterceptor } from './common/interceptors/sanitizer.interceptor';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(compression());
  app.use(cookieParser());

  // 1. Advanced Helmet Configuration (Anti-XSS, Anti-Sniffing, Clickjacking)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'https:',
            'http://localhost:4000',
            'http://localhost:3001',
            'http://127.0.0.1:4000',
            'http://127.0.0.1:3001',
            'res.cloudinary.com',
          ],
          connectSrc: [
            "'self'",
            'https:',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://localhost:4000',
            'http://127.0.0.1:4000',
          ],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: [
            "'self'",
            'https:',
            'http://localhost:4000',
            'http://127.0.0.1:4000',
            'res.cloudinary.com',
          ],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );


  // 2. Dynamic CORS — supports Vercel, Render, and local dev
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
  ];

  // Support comma-separated FRONTEND_URL (e.g. multiple Vercel preview URLs)
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    frontendUrl
      .split(',')
      .map((u) => u.trim())
      .forEach((u) => {
        if (u && !allowedOrigins.includes(u)) allowedOrigins.push(u);
      });
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server or no-origin requests
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app or *.onrender.com (covers all preview + production URLs)
      if (
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      console.warn(`[CORS BLOCKED] Origin: ${origin}`);
      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new SanitizerInterceptor());

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
