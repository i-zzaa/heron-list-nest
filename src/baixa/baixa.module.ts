import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { BaixaService } from './baixa.service';
import { BaixaController } from './baixa.controller';

@Module({
  providers: [BaixaService, PrismaService],
  exports: [BaixaService],
  controllers: [BaixaController],
})
export class BaixaModule {}
