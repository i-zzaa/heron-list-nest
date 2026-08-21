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
import { TicketService } from './ticket.service';
import { TicketProps } from './ticket.interface';
import { responseSuccess, responseError } from 'src/util/response';
import { normalizePageSize } from 'src/util/pagination';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('ticket')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));
      const data = await this.ticketService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('/dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.ticketService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.ticketService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_TICKET_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: TicketProps, @Response() response: any) {
    try {
      const data = await this.ticketService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_TICKET_LISTA_BOTAO_EDITAR')
  @Put()
  async put(@Body() body: TicketProps, @Response() response: any) {
    try {
      const data = await this.ticketService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_TICKET_LISTA_BOTAO_EXCLUIR')
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.ticketService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
