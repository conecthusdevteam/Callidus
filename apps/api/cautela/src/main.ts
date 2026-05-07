import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const clientPort = process.env.CLIENT_PORT ?? 5173;
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: [`http://localhost:${clientPort}`, `http://10.255.255.170:${clientPort}`],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const port = Number(process.env.PORT || 3000);

  logger.log(`API inicializando na porta ${port}`);

  await app.listen(port, '0.0.0.0');
}

bootstrap();
