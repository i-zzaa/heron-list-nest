import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { ConvenioService } from './convenio.service';
import { ConvenioController } from './convenio.controller';

@Module({
  providers: [ConvenioService, PrismaService],
  exports: [ConvenioService],
  controllers: [ConvenioController],
})
export class ConvenioModule {}
