import {
  Controller,
  UseGuards,
  Post,
  Request,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgendaService } from './agenda.service';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { DEVICE } from 'src/util/util';
import { messageError } from 'src/util/message.response';

// @UseGuards(AuthGuard('jwt'))
@Controller('evento')
export class AgendaController {
  constructor(
    private agendaService: AgendaService,
    private terapeutaService: TerapeutaService,
  ) {}

  @Get('filter/:start/:end')
  async getAll(
    @Param('start') start: string,
    @Param('end') end: string,
    @Request() req: any,
  ) {
    let inicioDoMes = start;
    let ultimoDiaDoMes = end;

    if (!req.headers.login) {
      return messageError();
    }

    if (Boolean(req.terapeutaId)) {
      return await this.terapeutaService.getAvailableTimes(
        inicioDoMes,
        ultimoDiaDoMes,
        req.query,
        req.headers.device,
        req.headers.login,
      );
    } else {
      return await this.agendaService.getFilter(
        req.params,
        req.query,
        req.headers?.login,
      );
    }
  }

  @Get(':start/:end')
  async getEventoRange(@Request() req: any) {
    return await this.agendaService.getRange(
      req.params,
      req.headers?.device,
      req.headers?.login,
    );
  }

  @Post()
  async create(@Request() req: any) {
    return await this.agendaService.createCalendario(
      req.body,
      req.headers.login,
    );
  }

  @Put()
  async update(@Request() req: any) {
    if (req.headers.device === DEVICE.mobile) {
      await this.agendaService.updateCalendarioMobile(
        req.body,
        req.headers.login,
      );
    } else {
      await this.agendaService.updateCalendario(req.body, req.headers.login);
    }

    return {
      status: true,
      message: 'Atualizado com sucesso!',
    };
  }

  @Put()
  async check(@Request() req: any) {
    return await this.agendaService.updateCalendarioMobile(
      req.body,
      req.headers.login,
    );
  }

  @Put()
  async atestado(@Request() req: any) {
    return await this.agendaService.updateCalendarioAtestado(
      req.query.id,
      req.headers.login,
    );
  }

  @Delete()
  async delete(@Request() req: any) {
    return await this.agendaService.delete(req.query.id, req.headers.login);
  }
}
