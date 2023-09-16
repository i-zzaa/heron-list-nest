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
import { LocalidadeService } from './localidade.service';
import { LocalidadeProps } from './localidade.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('localidade')
export class LocalidadeController {
  constructor(private localidadeService: LocalidadeService) {}

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const data = await await this.localidadeService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.localidadeService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.localidadeService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: LocalidadeProps, @Response() response: any) {
    try {
      const data = await this.localidadeService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: LocalidadeProps, @Response() response: any) {
    try {
      const data = await this.localidadeService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.localidadeService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
