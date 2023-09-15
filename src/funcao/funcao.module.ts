import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { FuncaoService } from './funcao.service';
import { FuncaoController } from './funcao.controller';

@Module({
  providers: [FuncaoService, PrismaService],
  exports: [FuncaoService],
  controllers: [FuncaoController],
})
export class FuncaoModule {}
