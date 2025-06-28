import { Controller, UseGuards, Get, Response, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TerapeutaService } from './terapeuta.service';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('terapeuta')
export class TerapeutaController {
  constructor(private terapeutaService: TerapeutaService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.terapeutaService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
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
      responseError(response);
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
      responseError(response);
    }
  }
}
