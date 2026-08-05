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
import { normalizePageSize } from 'src/util/pagination';
import { StatusEventoService } from './status-evento.service';
import { StatusEventosProps } from './status-evento.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('status-eventos')
export class StatusEventoController {
  constructor(private statusEvento: StatusEventoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.statusEvento.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await this.statusEvento.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.statusEvento.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_STATUS_EVENTOS_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: StatusEventosProps, @Response() response: any) {
    try {
      const data = await this.statusEvento.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_STATUS_EVENTOS_LISTA_BOTAO_EDITAR')
  @Put()
  async put(@Body() body: StatusEventosProps, @Response() response: any) {
    try {
      const data = await this.statusEvento.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_STATUS_EVENTOS_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.statusEvento.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
