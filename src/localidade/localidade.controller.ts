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
import { normalizePageSize } from 'src/util/pagination';
import { LocalidadeService } from './localidade.service';
import { LocalidadeProps } from './localidade.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('localidade')
export class LocalidadeController {
  constructor(private localidadeService: LocalidadeService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.localidadeService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await await this.localidadeService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.localidadeService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async create(@Body() body: LocalidadeProps, @Response() response: any) {
    try {
      const data = await this.localidadeService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async put(@Body() body: LocalidadeProps, @Response() response: any) {
    try {
      const data = await this.localidadeService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.localidadeService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
