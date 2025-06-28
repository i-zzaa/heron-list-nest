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
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModalidadeService } from './modalidade.service';
import { ModalidadeProps } from './modalidade.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('modalidade')
export class ModalidadeController {
  constructor(private modalidadeService: ModalidadeService) {}

  @Get('dropdown')
  async dropdown(
    @Query('statusPacienteCod') statusPacienteCod: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.modalidadeService.dropdown(statusPacienteCod);
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
      const data = await this.modalidadeService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.modalidadeService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: ModalidadeProps, @Response() response: any) {
    try {
      const data = await this.modalidadeService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: ModalidadeProps, @Response() response: any) {
    try {
      const data = await this.modalidadeService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.modalidadeService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
