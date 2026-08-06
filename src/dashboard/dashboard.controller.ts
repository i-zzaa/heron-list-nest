import { Controller, Get, Response, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { responseError, responseSuccess } from 'src/util/response';
import { ProfileGuard } from 'src/auth/profile.guard';
import { RequireProfile } from 'src/auth/require-profile.decorator';
import { PERFIL } from 'src/util/util';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

// Módulo gerencial — restrito a Administrador/Developer por perfil
// (ProfileGuard, nível de módulo) e, em cima disso, por tag por widget
// (PermissionsGuard + @RequirePermission em cada rota — tags DASHBOARD_*,
// hoje atribuídas só ao grupo ADM; Developer bypassa por perfil de
// qualquer forma). As duas guards juntas: perfil erra e nem carrega o
// usuário/permissões; tag dá controle fino de quais widgets cada grupo
// Admin específico enxerga, se um dia isso divergir.
@UseGuards(AuthGuard('jwt'), ProfileGuard, PermissionsGuard)
@RequireProfile(PERFIL.admin, PERFIL.dev)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @RequirePermission('DASHBOARD_RESUMO')
  @Get('resumo')
  async resumo(@Response() response: any) {
    try {
      const data = await this.dashboardService.getResumo();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_ESPECIALIDADE')
  @Get('sessoes-especialidade')
  async sessoesPorEspecialidade(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorEspecialidade();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_STATUS')
  @Get('sessoes-status')
  async sessoesPorStatus(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorStatus();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_OCUPACAO_PERIODO')
  @Get('ocupacao-periodo')
  async ocupacaoPorPeriodo(@Response() response: any) {
    try {
      const data = await this.dashboardService.getOcupacaoPorPeriodo();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_FLUXO_PACIENTES')
  @Get('fluxo-pacientes')
  async fluxoPacientes(@Response() response: any) {
    try {
      const data = await this.dashboardService.getFluxoPacientes();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_FILA_ESPECIALIDADE')
  @Get('fila-especialidade')
  async filaPorEspecialidade(@Response() response: any) {
    try {
      const data = await this.dashboardService.getFilaPorEspecialidade();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_PENDENCIAS')
  @Get('pendencias')
  async pendencias(@Response() response: any) {
    try {
      const data = await this.dashboardService.getPendencias();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_HOJE')
  @Get('sessoes-hoje')
  async sessoesHoje(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesHoje();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_TOP_TERAPEUTAS')
  @Get('top-terapeutas')
  async topTerapeutas(@Response() response: any) {
    try {
      const data = await this.dashboardService.getTopTerapeutas();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
