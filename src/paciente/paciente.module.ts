import { Module, forwardRef } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  providers: [PacienteService, PrismaService, PermissionsGuard],
  exports: [PacienteService],
  controllers: [PacienteController],
})
export class PacienteModule {}
