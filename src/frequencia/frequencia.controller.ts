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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FrequenciaService } from './frequencia.service';
import { FrequenciaProps } from './frequencia.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('frequencia')
export class FrequenciaController {
  constructor(private FrequenciaService: FrequenciaService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.FrequenciaService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async create(@Body() body: FrequenciaProps, @Response() response: any) {
    try {
      const data = await this.FrequenciaService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async put(@Body() body: FrequenciaProps, @Response() response: any) {
    try {
      const data = await this.FrequenciaService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.FrequenciaService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
