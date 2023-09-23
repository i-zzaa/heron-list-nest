import { Module, forwardRef } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { AgendaModule } from 'src/agenda/agenda.module';
import { AgendaService } from 'src/agenda/agenda.service';
import { TerapeutaModule } from 'src/terapeuta/terapeuta.module';

@Module({
  providers: [PacienteService, PrismaService],
  exports: [PacienteService],
  controllers: [PacienteController],
})
export class PacienteModule {}
