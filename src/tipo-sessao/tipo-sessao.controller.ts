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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { TipoSessaoService } from './tipo-sessao.service';
import { TipoSessaoProps } from './tipo-sessao.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('tipo-sessao')
export class TipoSessaoController {
  constructor(private tipoSessaoService: TipoSessaoService) {}

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = normalizePageSize(Number(req.query.pageSize));

    return await this.tipoSessaoService.getAll(page, pageSize);
  }

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.tipoSessaoService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async create(@Body() body: TipoSessaoProps) {
    return await this.tipoSessaoService.create(body);
  }

  @Put()
  async put(@Body() body: TipoSessaoProps) {
    return await this.tipoSessaoService.update(body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.tipoSessaoService.delete(Number(id));
  }
}
