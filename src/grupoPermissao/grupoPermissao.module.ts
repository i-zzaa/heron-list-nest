import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { GrupoPermissaoService } from './grupoPermissao.service';
import { GrupoPermissaoController } from './grupoPermissao.controller';

@Module({
  providers: [GrupoPermissaoService, PrismaService],
  exports: [GrupoPermissaoService],
  controllers: [GrupoPermissaoController],
})
export class GrupoPermissaoModule {}
