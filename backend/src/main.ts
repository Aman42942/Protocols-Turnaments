import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // 1. Advanced Helmet Configuration (Anti-XSS, Anti-Sniffing, Clickjacking)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"], // Prevents Clickjacking
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  console.log('Current NODE_ENV:', process.env.NODE_ENV);
  // Debug: Log all incoming requests (Development Only)
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(
        `[Request] ${req.method} ${req.url} | Origin: ${req.headers.origin} | Referer: ${req.headers.referer}`,
      );
      next();
    });
  }

  // 2. Strict CORS Configuration (Zero-Trust)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // STRICT: Only accept requests from YOUR frontend
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // 3. Hardened Global Validation Pipe (Anti-Injection)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties not defined in DTOs
      forbidNonWhitelisted: true, // Throws an error if unknown properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
