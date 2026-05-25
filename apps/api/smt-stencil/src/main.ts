import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DateConverterInterceptor } from './common/interceptors/date-converter.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const clientPort = process.env.CLIENT_PORT ?? 5173;

  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      `http://10.255.255.170:${clientPort}`,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  if (process.env.NODE_ENV !== 'hml') {
    const config = new DocumentBuilder()
    .setTitle('LSP API documentation')
    .setDescription('API documentation for stencil/plate washing system.')
    .setVersion('1.0')
    .addTag('stencil', 'operations related to stencils')
    .addTag('plate', 'operations related to plates')
    .addTag('wash', 'operations related to washing stencils and plates')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        showRequestDuration: true,
      },
      customSiteTitle: 'LSP API - Documentation',
    });
  }

  app.useGlobalInterceptors(new DateConverterInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application running on port ${port}`);
}
bootstrap();
