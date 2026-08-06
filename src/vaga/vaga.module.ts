import { Module } from '@nestjs/common';

import { VagaService } from './vaga.service';
import { VagaController } from './vaga.controller';

import { PacienteService } from 'src/paciente/paciente.service';
import { HistoricoModule } from 'src/historico/historico.module';

@Module({
  providers: [VagaService, PacienteService],
  exports: [VagaService],
  controllers: [VagaController],
  imports: [HistoricoModule],
})
export class VagaModule {}
