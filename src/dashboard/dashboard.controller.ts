import { Controller, Get, Response, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { responseError, responseSuccess } from 'src/util/response';
import { ProfileGuard } from 'src/auth/profile.guard';
import { RequireProfile } from 'src/auth/require-profile.decorator';
import { PERFIL } from 'src/util/util';

// Módulo gerencial — restrito a Administrador/Developer (decisão do
// usuário), tanto por autenticação (AuthGuard('jwt')) quanto por perfil
// (ProfileGuard), aplicados uma vez no controller pra valer em toda rota.
@UseGuards(AuthGuard('jwt'), ProfileGuard)
@RequireProfile(PERFIL.admin, PERFIL.dev)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  async resumo(@Response() response: any) {
    try {
      const data = await this.dashboardService.getResumo();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('sessoes-especialidade')
  async sessoesPorEspecialidade(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorEspecialidade();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('sessoes-status')
  async sessoesPorStatus(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesPorStatus();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('ocupacao-periodo')
  async ocupacaoPorPeriodo(@Response() response: any) {
    try {
      const data = await this.dashboardService.getOcupacaoPorPeriodo();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('fluxo-pacientes')
  async fluxoPacientes(@Response() response: any) {
    try {
      const data = await this.dashboardService.getFluxoPacientes();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('fila-especialidade')
  async filaPorEspecialidade(@Response() response: any) {
    try {
      const data = await this.dashboardService.getFilaPorEspecialidade();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('pendencias')
  async pendencias(@Response() response: any) {
    try {
      const data = await this.dashboardService.getPendencias();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('sessoes-hoje')
  async sessoesHoje(@Response() response: any) {
    try {
      const data = await this.dashboardService.getSessoesHoje();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

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
