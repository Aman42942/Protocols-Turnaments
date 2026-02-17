import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(helmet());
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

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL,
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(null, false); // Block other origins
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
