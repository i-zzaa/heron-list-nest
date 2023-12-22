import { Module, forwardRef } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';

@Module({
  providers: [PacienteService, PrismaService],
  exports: [PacienteService],
  controllers: [PacienteController],
})
export class PacienteModule {}
