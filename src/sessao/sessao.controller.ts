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

  @Get('teste')
  async teste(@Param('id') calendarioId: number, @Response() response: any) {
    try {
      const data = await this.sessaoService.updateMaintenance(58, 29);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':id')
  async get(@Param('id') calendarioId: number, @Response() response: any) {
    try {
      const data = await this.sessaoService.get(calendarioId);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async saveSumary(
    @Body() body: any,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.sessaoService.create(body, req.user?.username);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async updateSumary(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.updateSumary(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
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
      responseError(response, error);
    }
  }

  @Get('atividade/:pacienteId')
  async getAtividadeSessaoByPacient(
    @Param('pacienteId') pacienteId: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.sessaoService.getAtividadeSessaoByPacient(
        Number(pacienteId),
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('protocolo')
  async createProtocolo(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.createProtocolo(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('atividadeSessao')
  async createAtividadeSessao(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.sessaoService.createAtividadeSessao(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // @Post()
  // async create(@Body() body: any, @Response() response: any) {
  //   try {
  //     const data = await this.sessaoService.create(body);
  //     responseSuccess(response, data);
  //   } catch (error) {
  //     responseError(response, error);
  //   }
  // }

  @Put()
  async put(@Body() body: any, @Response() response: any) {
    try {
      // const data = await this.sessaoService.update(body);
      // responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.sessaoService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
