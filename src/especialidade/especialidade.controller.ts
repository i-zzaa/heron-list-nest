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
import { EspecialidadeService } from './especialidade.service';
import { EspecialidadeProps } from './especialidade.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('especialidade')
export class EspecialidadeController {
  constructor(private especialidadeService: EspecialidadeService) {}

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.especialidadeService.search(search);
  }

  @Get('dropdown')
  async getAll() {
    return await this.especialidadeService.dropdown();
  }

  @Post()
  async create(@Body() body: EspecialidadeProps) {
    return await this.especialidadeService.create(body);
  }

  @Put(':id')
  async put(@Body() body: EspecialidadeProps, @Param('id') id: string) {
    return await this.especialidadeService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.especialidadeService.delete(id);
  }
}
