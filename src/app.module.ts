import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CatalogoController } from './catalogo/catalogo.controller';
import { CatalogoService } from './catalogo/catalogo.service';
import { ServicoController } from './servico/servico.controller';

import { TicketController } from './ticket/ticket.controller';
import { ServicoService } from './servico/servico.service';
import { TicketService } from './ticket/ticket.service';
import { PrismaService } from './prisma.service';

import * as cors from 'cors';

@Module({
  imports: [],
  controllers: [
    TicketController,
    ServicoController,
    CatalogoController,

    AppController,
  ],
  providers: [
    TicketService,
    ServicoService,
    CatalogoService,

    PrismaService,
    AppService,
  ],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(cors()) // Aplica o middleware cors
      .forRoutes('*'); // Habilita o CORS para todas as rotas
  }
}
