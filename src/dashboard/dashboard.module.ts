import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { ProfileGuard } from 'src/auth/profile.guard';
import { PacienteModule } from 'src/paciente/paciente.module';

@Module({
  providers: [DashboardService, PermissionsGuard, ProfileGuard],
  controllers: [DashboardController],
  imports: [PacienteModule],
})
export class DashboardModule {}
