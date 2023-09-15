import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { FinanceiroService } from './financeiro.service';
import { FinanceiroController } from './financeiro.controller';
import { PacienteService } from 'src/paciente/paciente.service';
import { AgendaService } from 'src/agenda/agenda.service';

@Module({
  providers: [FinanceiroService, PrismaService, PacienteService, AgendaService],
  exports: [FinanceiroService],
  controllers: [FinanceiroController],
})
export class FinanceiroModule {}
