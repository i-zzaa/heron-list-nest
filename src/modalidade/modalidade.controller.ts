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
  Query,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { ModalidadeService } from './modalidade.service';
import { ModalidadeProps } from './modalidade.interface';
import { responseSuccess, responseError } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('modalidade')
export class ModalidadeController {
  constructor(private modalidadeService: ModalidadeService) {}

  @Get('dropdown')
  async dropdown(
    @Query('statusPacienteCod') statusPacienteCod: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.modalidadeService.dropdown(statusPacienteCod);
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
      const data = await this.modalidadeService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.modalidadeService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_MODALIDADE_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: ModalidadeProps, @Response() response: any) {
    try {
      const data = await this.modalidadeService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_MODALIDADE_LISTA_BOTAO_EDITAR')
  @Put()
  async put(@Body() body: ModalidadeProps, @Response() response: any) {
    try {
      const data = await this.modalidadeService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_MODALIDADE_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.modalidadeService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
