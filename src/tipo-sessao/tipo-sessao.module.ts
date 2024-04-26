import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { TipoSessaoService } from './tipo-sessao.service';
import { TipoSessaoController } from './tipo-sessao.controller';

@Module({
  providers: [TipoSessaoService, PrismaService],
  exports: [TipoSessaoService],
  controllers: [TipoSessaoController],
})
export class TipoSessaoModule {}
