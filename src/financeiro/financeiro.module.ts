import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { FinanceiroService } from './financeiro.service';
import { FinanceiroController } from './financeiro.controller';
import { PacienteService } from 'src/paciente/paciente.service';
import { AgendaService } from 'src/agenda/agenda.service';
import { UserModule } from 'src/user/user.module';
import { LocalidadeModule } from 'src/localidade/localidade.module';
import { FrequenciaModule } from 'src/frequencia/frequencia.module';
import { VagaModule } from 'src/vaga/vaga.module';
import { BaixaModule } from 'src/baixa/baixa.module';
import { PacienteModule } from 'src/paciente/paciente.module';

@Module({
  providers: [FinanceiroService, PrismaService, AgendaService],
  exports: [FinanceiroService],
  controllers: [FinanceiroController],
  imports: [
    UserModule,
    LocalidadeModule,
    FrequenciaModule,
    VagaModule,
    BaixaModule,
    PacienteModule,
  ],
})
export class FinanceiroModule {}
