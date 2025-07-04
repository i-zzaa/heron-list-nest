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
import { PacienteService } from './paciente.service';
import { PatientCreate, PatientProps } from './paciente.interface';
import { responseSuccess, responseError, MESSAGE } from 'src/util/response';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';

@UseGuards(AuthGuard('jwt'))
@Controller('paciente')
export class PacienteController {
  constructor(private pacienteService: PacienteService) {}

  @Post()
  async create(@Body() body: PatientCreate, @Response() response: any) {
    try {
      const data = await this.pacienteService.create(body);
      responseSuccess(response, data, MESSAGE.cadastro_sucesso);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async update(@Body() body: PatientProps, @Response() response: any) {
    try {
      const data = await this.pacienteService.update(body);
      responseSuccess(response, data, MESSAGE.atualizacao_sucesso);
    } catch (error) {
      responseError(response);
    }
  }

  @Post('filtro')
  async filtro(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const data = await this.pacienteService.filterSinglePatients(
        req.body,
        page,
        pageSize,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
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
      responseError(response);
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

      responseError(response);
    }
  }

  @Get('dashboard')
  async getPatientsActived(@Response() response: any) {
    try {
      const data = await this.pacienteService.getPatientsActived();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
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
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.pacienteService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const data = await this.pacienteService.getAll(req.query, page, pageSize);

      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.pacienteService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put('desabilitar')
  async updateDisabled(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.pacienteService.updateDisabled(body);
      responseSuccess(response, data, MESSAGE.desabilitado_sucesso);
    } catch (error) {
      responseError(response);
    }
  }
}
