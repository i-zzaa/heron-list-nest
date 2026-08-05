import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { GrupoPermissaoService } from './grupoPermissao.service';
import { GrupoPermissaoController } from './grupoPermissao.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  providers: [GrupoPermissaoService, PrismaService, PermissionsGuard],
  exports: [GrupoPermissaoService],
  controllers: [GrupoPermissaoController],
})
export class GrupoPermissaoModule {}
