import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { VagaService } from './vaga.service';
import { VagaController } from './vaga.controller';

import { PacienteService } from 'src/paciente/paciente.service';

@Module({
  providers: [VagaService, PrismaService, PacienteService],
  exports: [VagaService],
  controllers: [VagaController],
})
export class VagaModule {}
