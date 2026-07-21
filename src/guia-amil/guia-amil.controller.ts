import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { responseError, responseSuccess } from 'src/util/response';
import { GuiaAmilService } from './guia-amil.service';

@UseGuards(AuthGuard('jwt'))
@Controller('guias')
export class GuiaAmilController {
  constructor(private readonly service: GuiaAmilService) {}

  @Get()
  async list(@Request() req: any, @Response() res: any) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = await this.service.list({ ...req.query, page, limit });
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Response() res: any) {
    try {
      const data = await this.service.findOne(Number(id));
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Post()
  async create(@Body() body: any, @Response() res: any) {
    try {
      const data = await this.service.create(body);
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Response() res: any) {
    try {
      const data = await this.service.update(Number(id), body);
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Post(':id/preparar-envio')
  async prepararEnvio(@Param('id') id: string, @Request() req: any, @Response() res: any) {
    try {
      const data = await this.service.prepararEnvio(Number(id), req.headers.iduser);
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Post(':id/enviar')
  async enviar(@Param('id') id: string, @Request() req: any, @Response() res: any) {
    try {
      const data = await this.service.enviarGuia(Number(id), req.headers.iduser);
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Get(':id/historico')
  async historico(@Param('id') id: string, @Response() res: any) {
    try {
      const data = await this.service.historico(Number(id));
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }
}
