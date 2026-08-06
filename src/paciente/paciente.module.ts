import { Module, forwardRef } from '@nestjs/common';

import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { HistoricoModule } from 'src/historico/historico.module';

@Module({
  providers: [PacienteService, PermissionsGuard],
  exports: [PacienteService],
  controllers: [PacienteController],
  imports: [HistoricoModule],
})
export class PacienteModule {}
