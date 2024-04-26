import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SessaoService } from './sessao.service';
import { SessaoController } from './sessao.controller';

@Module({
  providers: [SessaoService, PrismaService],
  exports: [SessaoService],
  controllers: [SessaoController],
})
export class SessaoModule {}
