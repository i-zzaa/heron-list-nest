import {
  Controller,
  UseGuards,
  Get,
  Response,
  Post,
  Body,
  Request,
  Delete,
  Param,
  Put,
} from '@nestjs/common';

import { responseError, responseSuccess } from 'src/util/response';
import { AuthGuard } from '@nestjs/passport';
import { PeiService } from './pei.service';
import { PeiProps } from './pei.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('pei')
export class PeiController {
  constructor(private peiService: PeiService) {}

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

  @Put()
  async update(
    @Body() body: PeiProps,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.peiService.update({
        data: body,
        where: {
          id: body.id,
        },
      });
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: any, @Response() response: any) {
    try {
      const data = await this.peiService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post('atividade-sessao')
  async createAtividadeSessao(
    @Body() body: any,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.peiService.createAtividadeSessao(
        body,
        Number(req.headers.iduser),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
