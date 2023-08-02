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
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import * as cors from 'cors';
import { CategoryService } from './category/category.service';
import { CategoryController } from './category/category.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    TicketController,
    ServiceController,
    CatalogController,
    CategoryController,

    AppController,
  ],
  providers: [
    TicketService,
    ServiceService,
    CatalogService,
    CategoryService,

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
