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
import { PeriodoService } from './periodo.service';
import { PeriodoProps } from './periodo.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('periodo')
export class PeriodoController {
  constructor(private periodoService: PeriodoService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.periodoService.getAll(page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.periodoService.search(search);
  }

  @Get('dropdown')
  async dropdown() {
    return await this.periodoService.dropdown();
  }

  @Post()
  async create(@Body() body: PeriodoProps) {
    return await this.periodoService.create(body);
  }

  @Put()
  async put(@Body() body: PeriodoProps) {
    return await this.periodoService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.periodoService.delete(id);
  }
}
