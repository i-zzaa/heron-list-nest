import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { UserService } from 'src/user/user.service';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { VagaService } from 'src/vaga/vaga.service';
import { PacienteModule } from 'src/paciente/paciente.module';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { BaixaService } from 'src/baixa/baixa.service';
import { PacienteService } from 'src/paciente/paciente.service';

@Module({
  providers: [
    AgendaService,
    PrismaService,
    UserService,
    LocalidadeService,
    FrequenciaService,
    VagaService,
    TerapeutaService,
    BaixaService,
    PacienteService,
  ],
  exports: [AgendaService],
  controllers: [AgendaController],
  imports: [PacienteModule],
})
export class AgendaModule {}
