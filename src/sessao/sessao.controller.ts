import {
  Controller,
  UseGuards,
  Get,
  Request,
  Body,
  Delete,
  Param,
  Post,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { responseError, responseSuccess } from 'src/util/response';
import { SessaoService } from './sessao.service';

@UseGuards(AuthGuard('jwt'))
@Controller('sessao')
export class SessaoController {
  constructor(private sessaoService: SessaoService) {}

  @Get(':id')
  async get(@Param('id') calendarioId: number, @Response() response: any) {
    try {
      const data = await this.sessaoService.get(calendarioId);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async saveSumary(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async updateSumary(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.updateSumary(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get('protocolo/:id')
  async getProtocoloByPacient(
    @Param('id') id: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.sessaoService.getProtocoloByPacient(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get('atividade/:id')
  async getAtividadeSessaoByPacient(
    @Param('id') id: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.sessaoService.getAtividadeSessaoByPacient(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post('protocolo')
  async createProtocolo(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.createProtocolo(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post('atividadeSessao')
  async createAtividadeSessao(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.createAtividadeSessao(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  // @Post()
  // async create(@Body() body: any, @Response() response: any) {
  //   try {
  //     const data = await this.sessaoService.create(body);
  //     responseSuccess(response, data);
  //   } catch (error) {
  //     responseError(response);
  //   }
  // }

  @Put()
  async put(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.sessaoService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
