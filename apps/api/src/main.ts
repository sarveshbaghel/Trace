import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet Security Headers (CSP, Frameguard DENY, nosniff, HSTS)
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      contentSecurityPolicy: true,
    }),
  );

  // Cookie Parser with Secret
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // CORS Configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend server running securely on port ${port}`);
}
bootstrap();