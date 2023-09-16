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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatusService } from './status.service';
import { StatusProps } from './status.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('status')
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.statusService.getAll(page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.statusService.search(search);
  }

  @Get('dropdown')
  async dropdown(@Query('statusPacienteCod') statusPacienteCod: string) {
    return await this.statusService.dropdown(statusPacienteCod);
  }

  @Post()
  async create(@Body() body: StatusProps) {
    return await this.statusService.create(body);
  }

  @Put(':id')
  async put(@Body() body: StatusProps) {
    return await this.statusService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.statusService.delete(id);
  }
}
