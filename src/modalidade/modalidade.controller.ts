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
import { ModalidadeService } from './modalidade.service';
import { ModalidadeProps } from './modalidade.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('modalidade')
export class ModalidadeController {
  constructor(private modalidadeService: ModalidadeService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.modalidadeService.getAll(page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.modalidadeService.search(search);
  }

  @Get('dropdown')
  async dropdown() {
    return await this.modalidadeService.dropdown();
  }

  @Post()
  async create(@Body() body: ModalidadeProps) {
    return await this.modalidadeService.create(body);
  }

  @Put()
  async put(@Body() body: ModalidadeProps) {
    return await this.modalidadeService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.modalidadeService.delete(id);
  }
}
