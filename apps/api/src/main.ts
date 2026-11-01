import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ensure uploads directory exists and serve it statically
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const heatmapsDir = path.join(uploadsDir, 'heatmaps');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(heatmapsDir)) {
    fs.mkdirSync(heatmapsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Helmet Security Headers (allow cross-origin images for mobile/admin)
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Cookie Parser with Secret
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // CORS Configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : true,
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`TRACE API is running securely on: http://0.0.0.0:${port}`);
}
bootstrap();