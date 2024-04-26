import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramaService } from './programa.service';
import { ProgramaController } from './programa.controller';

@Module({
  providers: [ProgramaService, PrismaService],
  exports: [ProgramaService],
  controllers: [ProgramaController],
})
export class ProgramaModule {}
