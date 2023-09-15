import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { EspecialidadeService } from './especialidade.service';
import { EspecialidadeController } from './especialidade.controller';

@Module({
  providers: [EspecialidadeService, PrismaService],
  exports: [EspecialidadeService],
  controllers: [EspecialidadeController],
})
export class EspecialidadeModule {}
