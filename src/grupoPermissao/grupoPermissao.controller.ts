import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { GrupoPermissaoService } from './grupoPermissao.service';
import { GrupoPermissaoProps } from './grupoPermissao.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('grupo-permissoes')
export class GrupoPermissaoController {
  constructor(private grupoPermissaoService: GrupoPermissaoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.grupoPermissaoService.dropdown();
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

      const data = await await this.grupoPermissaoService.getAll(
        page,
        pageSize,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_GRUPO_PERMISSOES_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: GrupoPermissaoProps, @Response() response: any) {
    try {
      const data = await this.grupoPermissaoService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_GRUPO_PERMISSOES_LISTA_BOTAO_EDITAR')
  @Put()
  async put(@Body() body: GrupoPermissaoProps, @Response() response: any) {
    try {
      const data = await this.grupoPermissaoService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
