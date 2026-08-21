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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { PacienteService } from './paciente.service';
import { PatientCreate, PatientProps } from './paciente.interface';
import { responseSuccess, responseError, MESSAGE } from 'src/util/response';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('paciente')
export class PacienteController {
  constructor(private pacienteService: PacienteService) {}

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_PACIENTES_FILTRO_BOTAO_CADASTRAR')
  @Post()
  async create(
    @Body() body: PatientCreate,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.create(body, req.user?.username);
      responseSuccess(response, data, MESSAGE.cadastro_sucesso);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_PACIENTES_LISTA_BOTAO_EDITAR')
  @Put()
  async update(
    @Body() body: PatientProps,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.update(body, req.user?.username);
      responseSuccess(response, data, MESSAGE.atualizacao_sucesso);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post('filtro')
  async filtro(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await this.pacienteService.filterSinglePatients(
        req.body,
        page,
        pageSize,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('dropdown')
  async dropdown(
    @Query('statusPacienteCod') statusPacienteCod: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.dropdown(statusPacienteCod);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }

    return;
  }

  @Get('especialidade/dropdown')
  async getPacienteEspecialidade(
    @Query('statusPacienteCod') statusPacienteCod: string,
    @Query('pacienteId') pacienteId: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.getPacienteEspecialidade(
        statusPacienteCod,
        Number(pacienteId),
      );

      responseSuccess(response, data);
    } catch (error) {
      console.log(error);

      responseError(response, error);
    }
  }

  @Get('dashboard')
  async getPatientsActived(@Response() response: any) {
    try {
      const data = await this.pacienteService.getPatientsActived();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('especialidades')
  async getPatientsEspecialidades(
    @Query('statusPacienteCod') statusPacienteCod: any,
    @Query('pacienteId') pacienteId: any,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.getPatientsEspcialidades(
        statusPacienteCod,
        pacienteId,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.pacienteService.search(search);
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
      const data = await this.pacienteService.getAll(
        req.query,
        page,
        pageSize,
        req.user?.username,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_PACIENTES_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      const data = await this.pacienteService.delete(Number(id), req.user?.username);
      responseSuccess(response, data, MESSAGE.desabilitado_sucesso);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_PACIENTES_LISTA_BOTAO_EXCLUIR')
  @Put('desabilitar')
  async updateDisabled(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.pacienteService.updateDisabled(body);
      responseSuccess(response, data, MESSAGE.desabilitado_sucesso);
    } catch (error) {
      responseError(response, error);
    }
  }
}
