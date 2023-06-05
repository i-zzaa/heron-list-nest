import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { ServiceController } from './service/service.controller';

import { TicketController } from './ticket/ticket.controller';
import { ServiceService } from './service/service.service';
import { TicketService } from './ticket/ticket.service';
import { PrismaService } from './prisma.service';

import * as cors from 'cors';

@Module({
  imports: [],
  controllers: [
    TicketController,
    ServiceController,
    CatalogController,

    AppController,
  ],
  providers: [
    TicketService,
    ServiceService,
    CatalogService,

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
