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
import { LocalidadeService } from './localidade.service';
import { LocalidadeProps } from './localidade.interface';

@Controller('localidade')
export class LocalidadeController {
  constructor(private localidadeService: LocalidadeService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.localidadeService.getAll(page, pageSize);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('dropdown')
  async dropdown() {
    return await this.localidadeService.dropdown();
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: LocalidadeProps) {
    return await this.localidadeService.create(body);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Put()
  async put(@Body() body: LocalidadeProps) {
    return await this.localidadeService.update(body);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.localidadeService.delete(id);
  }
}
