import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
