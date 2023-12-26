import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Response,
  Request,
} from '@nestjs/common';

import { ProgramaProps } from './programa.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { AuthGuard } from '@nestjs/passport';
import { ProgramaService } from './programa.service';

@UseGuards(AuthGuard('jwt'))
@Controller('programa')
export class ProgramaController {
  constructor(private programaService: ProgramaService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.programaService.dropdown();
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

      const data = await this.programaService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.programaService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.programaService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: any, @Response() response: any) {
    try {
      const data = await this.programaService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Response() response: any) {
    try {
      console.log(id);

      const data = await this.programaService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
