import {
  Controller,
  UseGuards,
  Get,
  Response,
  Post,
  Body,
  Request,
} from '@nestjs/common';

import { responseError, responseSuccess } from 'src/util/response';
import { AuthGuard } from '@nestjs/passport';
import { PeiService } from './pei.service';
import { PeiProps } from './pei.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('pei')
export class PeiController {
  constructor(private peiService: PeiService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.peiService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post('filtro')
  async filtro(@Response() response: any, @Body() body: any) {
    try {
      const data = await this.peiService.filtro(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(
    @Body() body: PeiProps,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.peiService.create(body, req.headers.iduser);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
