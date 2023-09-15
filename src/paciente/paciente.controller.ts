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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PacienteService } from './paciente.service';
import { PatientProps } from './paciente.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('paciente')
export class PacienteController {
  constructor(private pacienteService: PacienteService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.pacienteService.getAll(req.query, page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.pacienteService.search(search);
  }

  @Get('dropdown')
  async dropdown() {
    return await this.pacienteService.dropdown();
  }

  @Post()
  async create(@Body() body: PatientProps) {
    return await this.pacienteService.create(body);
  }

  @Put()
  async put(@Body() body: PatientProps) {
    return await this.pacienteService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.pacienteService.delete(id);
  }

  @Get('dashboard')
  async getPatientsActived() {
    return await this.pacienteService.getPatientsActived();
  }
}

// app.get('/pacientes', auth, patientController.get);
// app.get('/pacientes/dashboard', auth, patientController.getPatientsActived);
// app.post('/pacientes', auth, patientController.create);
// app.put('/pacientes', auth, patientController.update);
// app.get('/pacientes/especialidades', auth, patientController.getEspecialidades);
// app.put('/paciente/desabilitar', auth, patientController.disabled);
