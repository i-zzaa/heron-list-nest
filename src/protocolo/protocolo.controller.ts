import {
  Controller,
  UseGuards,
  Get,
  Response,
  Post,
  Body,
  Request,
  Put,
} from '@nestjs/common';

import { responseError, responseSuccess } from 'src/util/response';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { ProtocoloService } from './protocolo.service';
import { PortageProps } from './protocolo.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('protocolo')
export class ProtocoloController {
  constructor(private protocoloService: ProtocoloService) {}

  @Post('filtro')
  async filtro(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await this.protocoloService.filter(req.body, page, pageSize);

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('meta/filtro')
  async filterMeta(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.protocoloService.filterMeta(req.body);

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('vbmapp')
  async vbmapCreate(
    @Body() body: PortageProps,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.protocoloService.vbmapCreate(
        body,
        req.headers.iduser,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('portage')
  async createPostage(
    @Body() body: PortageProps,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.protocoloService.createOrUpdatePostage(
        body,
        req.headers.iduser,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async update(
    @Body() body: PortageProps,
    @Response() response: any,
    @Request() req: any,
  ) {
    try {
      const data = await this.protocoloService.update(body, req.headers.iduser);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('portage/dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.protocoloService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('vbmapp/:nivel/dropdown')
  async vbmapDropdown(@Response() response: any, @Request() req: any) {
    try {
      const data = await this.protocoloService.vbmapDropdown(req.params.nivel);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('tipo-portage/dropdown')
  async tipoPortagedropdown(@Response() response: any) {
    try {
      const data = await this.protocoloService.tipoPortagedropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('faixa-etaria/dropdown')
  async faixaEtariadropdown(@Response() response: any) {
    try {
      const data = await this.protocoloService.faixaEtariadropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('dropdown')
  async tipoProtocoloropdown(@Response() response: any) {
    try {
      const data = await this.protocoloService.tipoProtocoloropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
