import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SessaoService } from './sessao.service';
import { SessaoController } from './sessao.controller';
import { AgendaService } from 'src/agenda/agenda.service';
import { BaixaService } from 'src/baixa/baixa.service';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { PacienteService } from 'src/paciente/paciente.service';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { UserService } from 'src/user/user.service';
import { VagaService } from 'src/vaga/vaga.service';

@Module({
  providers: [
    SessaoService,
    PrismaService,
    AgendaService,
    UserService,
    LocalidadeService,
    FrequenciaService,
    VagaService,
    TerapeutaService,
    BaixaService,
    PacienteService,
  ],
  exports: [SessaoService],
  controllers: [SessaoController],
})
export class SessaoModule {}
