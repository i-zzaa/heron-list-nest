import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ModalidadeService } from './modalidade.service';
import { ModalidadeController } from './modalidade.controller';

@Module({
  providers: [ModalidadeService, PrismaService],
  exports: [ModalidadeService],
  controllers: [ModalidadeController],
})
export class ModalidadeModule {}
