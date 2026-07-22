import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { responseError, responseSuccess } from 'src/util/response';
import { GuiaAmilService } from './guia-amil.service';

@UseGuards(AuthGuard('jwt'))
@Controller('lotes-guias')
export class LoteGuiaController {
  constructor(private readonly service: GuiaAmilService) {}

  @Post('enviar')
  async enviarLote(
    @Body() body: any,
    @Request() req: any,
    @Response() res: any,
  ) {
    try {
      const data = await this.service.criarLote(
        body.guiaIds || [],
        body.origem || 'MANUAL',
        req.headers.iduser,
      );
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Response() res: any) {
    try {
      const data = await this.service.findOneLote(Number(id));
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Post(':id/consultar')
  async consultar(@Param('id') id: string, @Response() res: any) {
    try {
      const data = await this.service.consultarLote(Number(id));
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }

  @Post(':id/reprocessar')
  async reprocessar(@Param('id') id: string, @Response() res: any) {
    try {
      const data = await this.service.reprocessarLote(Number(id));
      responseSuccess(res, data);
    } catch (error) {
      responseError(res);
    }
  }
}
