import { Controller, UseGuards, Post, Body, Response } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceiroService } from './financeiro.service';
import { responseSuccess, responseError } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('financeiro')
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  @UseGuards(PermissionsGuard)
  @RequirePermission('FINANCEIRO_FILTRO_BOTAO_PESQUISAR')
  @Post('terapeuta')
  async terapeuta(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.financeiroService.terapeuta(body);
      console.log('data', data);
      responseSuccess(response, data);
    } catch (error) {
      console.log(error);

      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('FINANCEIRO_FILTRO_BOTAO_PESQUISAR')
  @Post('paciente')
  async paciente(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.financeiroService.paciente(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
