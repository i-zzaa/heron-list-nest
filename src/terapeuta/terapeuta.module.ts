import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { TerapeutaService } from './terapeuta.service';
import { TerapeutaController } from './terapeuta.controller';
import { FrequenciaModule } from 'src/frequencia/frequencia.module';
import { LocalidadeModule } from 'src/localidade/localidade.module';
import { UserModule } from 'src/user/user.module';
import { VagaModule } from 'src/vaga/vaga.module';
import { AgendaService } from 'src/agenda/agenda.service';
import { AgendaModule } from 'src/agenda/agenda.module';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [TerapeutaService, PrismaService, AgendaService],
  exports: [TerapeutaService],
  controllers: [TerapeutaController],
  imports: [],
})
export class TerapeutaModule {}
