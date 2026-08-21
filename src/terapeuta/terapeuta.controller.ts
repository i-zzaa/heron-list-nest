import {
  Controller,
  UseGuards,
  Get,
  Response,
  Query,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TerapeutaService } from './terapeuta.service';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('terapeuta')
export class TerapeutaController {
  constructor(private terapeutaService: TerapeutaService) {}

  // Item 4 do pedido do front (docs/pedido-backend-dashboard.md):
  // dashboard de produtividade agregado, hoje calculado no cliente em
  // cima de /evento/filtro.
  @Get('dashboard')
  async dashboard(
    @Query('terapeutaId') terapeutaId: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      const data = await this.terapeutaService.getDashboardResumo(
        Number(terapeutaId),
        dataInicio,
        dataFim,
        req.user?.username,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.terapeutaService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('especialidade/dropdown')
  async getTerapeutaByEspecialidade(
    @Query('especialidade') especialidade: string,
    @Response() response: any,
  ) {
    try {
      const data =
        await this.terapeutaService.getTerapeutaByEspecialidadeDropdown(
          especialidade,
        );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('paciente/dropdown')
  async getPacienteByTerapeuta(
    @Query('terapeutaId') terapeutaId: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.terapeutaService.getPacienteByTerapeutaDropdown(
        Number(terapeutaId),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
