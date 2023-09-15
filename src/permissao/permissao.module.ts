import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { PermissaoService } from './permissao.service';
import { PermissaoController } from './permissao.controller';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [PermissaoService, PrismaService, UserService],
  exports: [PermissaoService],
  controllers: [PermissaoController],
})
export class PermissaoModule {}
