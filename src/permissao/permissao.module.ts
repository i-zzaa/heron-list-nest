import { Module } from '@nestjs/common';

import { PermissaoService } from './permissao.service';
import { PermissaoController } from './permissao.controller';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [PermissaoService, UserService],
  exports: [PermissaoService],
  controllers: [PermissaoController],
})
export class PermissaoModule {}
