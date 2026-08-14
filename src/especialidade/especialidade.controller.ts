import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Response,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EspecialidadeService } from './especialidade.service';
import { EspecialidadeProps } from './especialidade.interface';
import { responseSuccess, responseError } from 'src/util/response';
import { normalizePageSize } from 'src/util/pagination';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('especialidade')
export class EspecialidadeController {
  constructor(private especialidadeService: EspecialidadeService) {}

  // Faltava o endpoint de listagem paginada (só existia dropdown/search) —
  // o frontend chama GET /especialidade?page=&pageSize= e caía direto no
  // 404, já que ':search' abaixo exige um segmento de rota (não casa com a
  // raiz do controller).
  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));
      const data = await this.especialidadeService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('/dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.especialidadeService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = this.especialidadeService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_ESPECIALIDADE_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: EspecialidadeProps, @Response() response: any) {
    try {
      const data = await this.especialidadeService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_ESPECIALIDADE_LISTA_BOTAO_EDITAR')
  @Put()
  async put(
    @Body() body: EspecialidadeProps,
    @Param('id') id: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.especialidadeService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_ESPECIALIDADE_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.especialidadeService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
