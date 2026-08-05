import { Module } from '@nestjs/common';

import { VagaService } from './vaga.service';
import { VagaController } from './vaga.controller';

import { PacienteService } from 'src/paciente/paciente.service';

@Module({
  providers: [VagaService, PacienteService],
  exports: [VagaService],
  controllers: [VagaController],
})
export class VagaModule {}
