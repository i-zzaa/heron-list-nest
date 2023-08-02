import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // app.enableCors({
  //   origin: [
  //     'http://127.0.0.1:5173',
  //     'http://192.168.15.113:5173',
  //     'https://fbuots.hospedagemelastica.com.br/',
  //   ],
  // });

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
