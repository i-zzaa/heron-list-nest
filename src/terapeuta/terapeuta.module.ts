import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { TerapeutaService } from './terapeuta.service';
import { TerapeutaController } from './terapeuta.controller';
import { UserModule } from 'src/user/user.module';
import { AgendaService } from 'src/agenda/agenda.service';
import { LocalidadeModule } from 'src/localidade/localidade.module';
import { FrequenciaModule } from 'src/frequencia/frequencia.module';
import { VagaModule } from 'src/vaga/vaga.module';
import { BaixaModule } from 'src/baixa/baixa.module';
import { PacienteModule } from 'src/paciente/paciente.module';

@Module({
  providers: [TerapeutaService, PrismaService, AgendaService],
  exports: [TerapeutaService],
  controllers: [TerapeutaController],
  imports: [
    UserModule,
    LocalidadeModule,
    FrequenciaModule,
    VagaModule,
    BaixaModule,
    PacienteModule,
  ],
})
export class TerapeutaModule {}
