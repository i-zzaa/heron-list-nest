import {
  Controller,
  UseGuards,
  Post,
  Request,
  Get,
  Param,
  Put,
  Delete,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgendaService } from './agenda.service';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';
import { DEVICE } from 'src/util/util';
import { messageError } from 'src/util/message.response';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
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
    @Response() response: any,
  ) {
    try {
      let inicioDoMes = start;
      let ultimoDiaDoMes = end;

      if (!req.headers.login) {
        return messageError();
      }

      if (Boolean(req.terapeutaId)) {
        const data = await this.terapeutaService.getAvailableTimes(
          inicioDoMes,
          ultimoDiaDoMes,
          req.query,
          req.headers.device,
          req.headers.login,
        );

        responseSuccess(response, data);
      } else {
        const data = await this.agendaService.getFilter(
          req.params,
          req.query,
          req.headers?.login,
        );

        responseSuccess(response, data);
      }
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':start/:end')
  async getEventoRange(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.agendaService.getRange(
        req.params,
        req.headers?.device,
        req.headers?.login,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.agendaService.createCalendario(
        req.body,
        req.headers.login,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async update(@Request() req: any, @Response() response: any) {
    try {
      if (req.headers.device === DEVICE.mobile) {
        await this.agendaService.updateCalendarioMobile(
          req.body,
          req.headers.login,
        );
      } else {
        await this.agendaService.updateCalendario(req.body, req.headers.login);
      }

      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async check(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.updateCalendarioMobile(
        req.body,
        req.headers.login,
      );
      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async atestado(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.updateCalendarioAtestado(
        req.query.id,
        req.headers.login,
      );

      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response);
    }
  }

  @Delete()
  async delete(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.delete(req.query.id, req.headers.login);
      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response);
    }
  }
}
