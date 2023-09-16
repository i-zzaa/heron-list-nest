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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatusEventoService } from './status-evento.service';
import { StatusEventosProps } from './status-evento.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('status-eventos')
export class StatusEventoController {
  constructor(private statusEvento: StatusEventoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.statusEvento.dropdown();
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

      const data = await this.statusEvento.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.statusEvento.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: StatusEventosProps, @Response() response: any) {
    try {
      const data = await this.statusEvento.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: StatusEventosProps, @Response() response: any) {
    try {
      const data = await this.statusEvento.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.statusEvento.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
