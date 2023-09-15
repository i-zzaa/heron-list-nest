import {
  Controller,
  UseGuards,
  Get,
  Body,
  Delete,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VagaService } from './vaga.service';
import { messageUpdate } from 'src/util/message.response';
import { VagaEspecialidadeProps, VagaProps } from './vaga.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('vagas')
export class VagaController {
  constructor(private vagaService: VagaService) {}

  @Put('agendar')
  async update(@Body() body: VagaEspecialidadeProps) {
    const data = await this.vagaService.update(body);
    const message = {
      data: data ? 'Paciente ainda na fila' : 'Paciente saiu da fila',
    };

    return messageUpdate(message);
  }

  @Put('agendar/especialidade')
  async updateEspecialidadeVaga(@Body() body: any) {
    const data = await this.vagaService.updateEspecialidadeVaga(body);
    const message = {
      data: data ? 'Paciente ainda na fila' : 'Paciente saiu da fila',
    };

    return messageUpdate(message);
  }

  @Put('/devolutiva')
  async updateReturn(@Body() body: any) {
    return await this.vagaService.updateReturn(body);
  }
}
