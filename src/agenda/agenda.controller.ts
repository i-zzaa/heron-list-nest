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
import { dateAddtDay } from 'src/util/format-date';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('evento')
export class AgendaController {
  constructor(
    private agendaService: AgendaService,
    private terapeutaService: TerapeutaService,
  ) {}

  @Get('filtro/:start/:end')
  async getAll(
    @Param('start') start: string,
    @Param('end') end: string,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      if (!req.user?.username) {
        return messageError();
      }
      if (Boolean(req.query.terapeutaId)) {
        const inicioDoMes = start;
        const ultimoDiaDoMes = end;

        const data = await this.terapeutaService.getAvailableTimes(
          inicioDoMes,
          ultimoDiaDoMes,
          req.query,
          req.headers.device,
          req.user?.username,
        );

        responseSuccess(response, data);
      } else {
        const data = await this.agendaService.getFilter(
          req.params,
          req.query,
          req.user?.username,
        );

        responseSuccess(response, data);
      }
    } catch (error) {
      console.log(error);

      responseError(response, error);
    }
  }

  @Get(':start/:end')
  async getEventoRange(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.agendaService.getRange(
        req.params,
        req.headers?.device,
        req.user?.username,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('AGENDA_CALENDARIO_FILTRO_BOTAO_CADASTRAR')
  @Post()
  async create(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.agendaService.createCalendario(
        req.body,
        req.user?.username,
      );

      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // Cobre tanto a edição via web quanto a via mobile (quando o header
  // `device` indica mobile, delega pra `updateCalendarioMobile`) — mesma
  // tag pras duas, `check`/`atestado` (check-in e atestado) continuam sem
  // tag por serem ações mais restritas e de mapeamento menos óbvio.
  @UseGuards(PermissionsGuard)
  @RequirePermission('AGENDA_CALENDARIO_LISTA_EDITAR')
  @Put()
  async update(@Request() req: any, @Response() response: any) {
    try {
      if (req.headers.device === DEVICE.mobile) {
        const dataFim = dateAddtDay(req.body.date, 1);

        await this.agendaService.updateCalendarioMobile(
          req.body,
          req.user?.username,
          req.body.date,
          dataFim,
        );
      } else {
        await this.agendaService.updateCalendario(req.body, req.user?.username);
      }

      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      console.log(error);

      responseError(response, error);
    }
  }

  @Put('check')
  async check(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.updateCalendarioMobile(
        req.body.id,
        req.user?.username,
      );
      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put('atestado')
  async atestado(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.updateCalendarioAtestado(
        req.query.id,
        req.user?.username,
      );

      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('AGENDA_CALENDARIO_LISTA_EXCLUIR')
  @Delete()
  async delete(@Request() req: any, @Response() response: any) {
    try {
      await this.agendaService.delete(req.query.id, req.user?.username);
      responseSuccess(response, { message: 'Atualizado com sucesso!' });
    } catch (error) {
      responseError(response, error);
    }
  }
}
