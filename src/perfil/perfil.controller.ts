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
import { PerfilService } from './perfil.service';
import { PerfilProps } from './perfil.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('perfil')
export class PerfilController {
  constructor(private perfilService: PerfilService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.perfilService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Post()
  async create(@Body() body: PerfilProps, @Response() response: any) {
    try {
      const data = await this.perfilService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async put(@Body() body: PerfilProps, @Response() response: any) {
    try {
      const data = await this.perfilService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.perfilService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
