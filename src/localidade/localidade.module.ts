import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { LocalidadeService } from './localidade.service';
import { LocalidadeController } from './localidade.controller';

@Module({
  providers: [LocalidadeService, PrismaService],
  exports: [LocalidadeService],
  controllers: [LocalidadeController],
})
export class LocalidadeModule {}
