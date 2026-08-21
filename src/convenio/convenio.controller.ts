import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Request,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConvenioService } from './convenio.service';
import { ConvenioProps } from './convenio.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { normalizePageSize } from 'src/util/pagination';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

// Convenio não tinha nenhuma tag de permissão (achado na rodada de
// segurança) — não havia CADASTRO_CONVENIO* nem órfã pra reaproveitar (só
// existiam tags de *campo de filtro* em outras telas, ex.:
// FILA_AVALIACAO_FILTRO_SELECT_CONVENIO), então as 4 tags abaixo são
// novas, criadas nesta migration, mesmo molde de CADASTRO_ESPECIALIDADE.
// dropdown/search continuam sem tag (leitura, mesmo padrão dos outros
// cadastros auxiliares — Especialidade, Localidade, Funcao, Ticket).
@UseGuards(AuthGuard('jwt'))
@Controller('convenio')
export class ConvenioController {
  constructor(private convenioService: ConvenioService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.convenioService.dropdown();
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
      const data = await this.convenioService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // GET /convenio/:search — busca por texto da listagem. Precisa vir
  // depois de 'dropdown' e de '' (rota estática x parametrizada).
  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.convenioService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_CONVENIO_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: ConvenioProps, @Response() response: any) {
    try {
      const data = await this.convenioService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_CONVENIO_LISTA_BOTAO_EDITAR')
  @Put()
  async put(@Body() body: ConvenioProps, @Response() response: any) {
    try {
      const data = await this.convenioService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_CONVENIO_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.convenioService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
