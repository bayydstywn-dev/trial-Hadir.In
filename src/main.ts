import { ValidationPipe } from '@nestjs/common'; // 1. Tambah Import ini
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 2. Tambah Validation Pipe (agar DTO berfungsi)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. Tambah CORS (agar Next.js Frontend bisa akses API)
  app.enableCors();

  await app.listen(3000);
}
bootstrap();