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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConvenioService } from './convenio.service';
import { ConvenioProps } from './convenio.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('convenio')
export class ConvenioController {
  constructor(private convenioService: ConvenioService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.convenioService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: ConvenioProps, @Response() response: any) {
    try {
      const data = await this.convenioService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: ConvenioProps, @Response() response: any) {
    try {
      const data = await this.convenioService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param() id: number, @Response() response: any) {
    try {
      const data = await this.convenioService.delete(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
