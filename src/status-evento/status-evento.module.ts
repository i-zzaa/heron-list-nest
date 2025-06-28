import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEventoService } from './status-evento.service';
import { StatusEventoController } from './status-evento.controller';

@Module({
  providers: [StatusEventoService, PrismaService],
  exports: [StatusEventoService],
  controllers: [StatusEventoController],
})
export class StatusEventoModule {}
