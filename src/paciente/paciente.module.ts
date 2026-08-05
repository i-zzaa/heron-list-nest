import { Module, forwardRef } from '@nestjs/common';

import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  providers: [PacienteService, PermissionsGuard],
  exports: [PacienteService],
  controllers: [PacienteController],
})
export class PacienteModule {}
