import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceiroService } from './financeiro.service';

// @UseGuards(AuthGuard('jwt'))
@Controller('financiero')
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  @Post('terapeuta')
  async terapeuta(@Body() body: any) {
    return await this.financeiroService.terapeuta(body);
  }

  @Post('paciente')
  async paciente(@Body() body: any) {
    return await this.financeiroService.paciente(body);
  }
}
