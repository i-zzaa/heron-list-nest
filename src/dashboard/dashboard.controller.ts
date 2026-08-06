import { Controller, Get, Query, Response, UseGuards } from '@nestjs/common';
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
//
// `?periodo=hoje|semana|mes` é aceito em toda rota (front já manda em
// toda chamada) — validado/normalizado em DashboardService.normalizarPeriodo,
// nunca quebra a rota com um valor inesperado. Alguns endpoints usam de
// verdade (resumo, sessões por especialidade/status, ocupação, top
// terapeutas); outros aceitam e ignoram de propósito, documentado em cada
// método do service (são estado atual, não evento datado, ou são
// estritamente "hoje" por natureza — ver conversa).
@UseGuards(AuthGuard('jwt'), ProfileGuard, PermissionsGuard)
@RequireProfile(PERFIL.admin, PERFIL.dev)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @RequirePermission('DASHBOARD_RESUMO')
  @Get('resumo')
  async resumo(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getResumo(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_ESPECIALIDADE')
  @Get('sessoes-especialidade')
  async sessoesPorEspecialidade(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorEspecialidade(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_STATUS')
  @Get('sessoes-status')
  async sessoesPorStatus(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorStatus(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_OCUPACAO_PERIODO')
  @Get('ocupacao-periodo')
  async ocupacaoPorPeriodo(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getOcupacaoPorPeriodo(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_FLUXO_PACIENTES')
  @Get('fluxo-pacientes')
  async fluxoPacientes(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      // `periodo` aceito por consistência de rota, ignorado no service
      // (fluxo de pacientes é estado atual — ver DashboardService).
      const data = await this.dashboardService.getFluxoPacientes(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_FILA_ESPECIALIDADE')
  @Get('fila-especialidade')
  async filaPorEspecialidade(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      // idem — fila de espera atual, `periodo` ignorado de propósito.
      const data = await this.dashboardService.getFilaPorEspecialidade(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_PENDENCIAS')
  @Get('pendencias')
  async pendencias(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getPendencias(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_SESSOES_HOJE')
  @Get('sessoes-hoje')
  async sessoesHoje(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      // "Próximas sessões de hoje" é estritamente hoje — `periodo` aceito
      // e ignorado de propósito (ver DashboardService).
      const data = await this.dashboardService.getSessoesHoje(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @RequirePermission('DASHBOARD_TOP_TERAPEUTAS')
  @Get('top-terapeutas')
  async topTerapeutas(@Query('periodo') periodo: string, @Response() response: any) {
    try {
      const data = await this.dashboardService.getTopTerapeutas(
        DashboardService.normalizarPeriodo(periodo),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
