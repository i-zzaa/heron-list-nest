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

@Module({
  imports: [AuthModule, UsersModule],
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
export class AppModule {}
