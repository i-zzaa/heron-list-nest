import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';

@Module({
  providers: [PerfilService, PrismaService],
  exports: [PerfilService],
  controllers: [PerfilController],
})
export class PerfilModule {}
