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
import { StatusEventoService } from './status-evento.service';
import { StatusEventosProps } from './status-evento.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('status-eventos')
export class StatusEventoController {
  constructor(private statusEvento: StatusEventoService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.statusEvento.getAll(page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.statusEvento.search(search);
  }

  @Get('dropdown')
  async dropdown() {
    return await this.statusEvento.dropdown();
  }

  @Post()
  async create(@Body() body: StatusEventosProps) {
    return await this.statusEvento.create(body);
  }

  @Put()
  async put(@Body() body: StatusEventosProps) {
    return await this.statusEvento.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.statusEvento.delete(id);
  }
}
