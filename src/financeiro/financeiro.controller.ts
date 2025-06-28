import { Controller, UseGuards, Post, Body, Response } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceiroService } from './financeiro.service';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('financeiro')
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  @Post('terapeuta')
  async terapeuta(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.financeiroService.terapeuta(body);
      responseSuccess(response, data);
    } catch (error) {
      console.log(error);

      responseError(response);
    }
  }

  @Post('paciente')
  async paciente(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.financeiroService.paciente(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
