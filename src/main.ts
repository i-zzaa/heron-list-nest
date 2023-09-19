import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cron from 'node-cron';
import { WhatsappService } from './whatsApp/whatsapp.service';
import { VenomBotAdapter } from './whatsApp/whatsapp.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const venomBotAdapter = app.get(VenomBotAdapter);
  await venomBotAdapter.start();

  const whatsappService = app.get(WhatsappService);

  // Configuração da tarefa agendada para executar todos os dias às 12h
  cron.schedule('0 12 * * *', () => {
    whatsappService.executeAlert();
  });

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
