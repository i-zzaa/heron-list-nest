import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cron from 'node-cron';
import { WhatsappService } from 'src/whatsApp/whatsApp.service';

import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const whatsappService = app.get(WhatsappService);
  process.env.NODE_ENV === 'production' && (await whatsappService.start());

  // Configuração da tarefa agendada para executar todos os dias às 12h
  cron.schedule('0 12 * * *', () => {
    whatsappService.executeAlert();
  });

  app.enableCors();

  app.use(
    session({
      secret: process.env.JWT_PRIVATE_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, 
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: [
      'http://127.0.0.1:5173',
      'https://fbuots.hospedagemelastica.com.br/',
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
