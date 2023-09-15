import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { UserService } from 'src/user/user.service';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { VagaService } from 'src/vaga/vaga.service';

@Module({
  providers: [
    AgendaService,
    PrismaService,
    UserService,
    LocalidadeService,
    FrequenciaService,
    VagaService,
  ],
  exports: [AgendaService],
  controllers: [AgendaController],
})
export class AgendaModule {}
