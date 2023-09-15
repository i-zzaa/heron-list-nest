import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FrequenciaService } from './frequencia.service';
import { FrequenciaProps } from './frequencia.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('frequencia')
export class FrequenciaController {
  constructor(private FrequenciaService: FrequenciaService) {}

  @Get('dropdown')
  async getAll() {
    return await this.FrequenciaService.dropdown();
  }

  @Post()
  async create(@Body() body: FrequenciaProps) {
    return await this.FrequenciaService.create(body);
  }

  @Put()
  async put(@Body() body: FrequenciaProps) {
    return await this.FrequenciaService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.FrequenciaService.delete(id);
  }
}
