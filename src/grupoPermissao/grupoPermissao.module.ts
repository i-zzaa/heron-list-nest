import { Module } from '@nestjs/common';

import { GrupoPermissaoService } from './grupoPermissao.service';
import { GrupoPermissaoController } from './grupoPermissao.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  providers: [GrupoPermissaoService, PermissionsGuard],
  exports: [GrupoPermissaoService],
  controllers: [GrupoPermissaoController],
})
export class GrupoPermissaoModule {}
