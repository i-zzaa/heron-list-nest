import { Controller, Get, Param, Response, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HistoricoService } from './historico.service';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('historico')
export class HistoricoController {
  constructor(private readonly historicoService: HistoricoService) {}

  @Get(':entidade/:entidadeId')
  async listar(
    @Param('entidade') entidade: string,
    @Param('entidadeId') entidadeId: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.historicoService.listar(entidade, Number(entidadeId));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
