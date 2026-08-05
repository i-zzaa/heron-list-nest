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
import { normalizePageSize } from 'src/util/pagination';
import { StatusService } from './status.service';
import { StatusProps } from './status.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('status')
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await await this.statusService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.statusService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get('dropdown')
  async dropdown(
    @Query('statusPacienteCod') statusPacienteCod: string,
    @Response() response: any,
  ) {
    try {
      const data = await this.statusService.dropdown(statusPacienteCod);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async create(@Body() body: StatusProps, @Response() response: any) {
    try {
      const data = await this.statusService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put(':id')
  async put(@Body() body: StatusProps, @Response() response: any) {
    try {
      const data = await this.statusService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.statusService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
