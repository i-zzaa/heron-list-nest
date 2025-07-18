import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Response,
  Put,
  Delete,
  Param,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FuncaoService } from './funcao.service';
import { FuncaoProps } from './funcao.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('funcao')
export class FuncaoController {
  constructor(private funcaoService: FuncaoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.funcaoService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get('terapeuta/dropdown')
  async getFuncaoByTerapeuta(
    @Query('terapeutaId') terapeutaId: number,
    @Response() response: any,
  ) {
    try {
      const data = await this.funcaoService.getTerapeutaByFuncaoDropdown(
        Number(terapeutaId),
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
  @Get('especialidade/dropdown')
  async getFuncaoByEspecialidadeDropdown(
    @Query('especialidade') especialidade: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.funcaoService.getFuncaoByEspecialidadeDropdown(
        especialidade,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const data = await this.funcaoService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.funcaoService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: FuncaoProps, @Response() response: any) {
    try {
      const data = await this.funcaoService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: FuncaoProps, @Response() response: any) {
    try {
      const data = await this.funcaoService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.funcaoService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
