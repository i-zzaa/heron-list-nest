import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissaoService } from './permissao.service';
import { PermissaoProps } from './permissao.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('permissao')
export class PermissaoController {
  constructor(private permissaoService: PermissaoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.permissaoService.getAll();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Post()
  async create(@Body() body: PermissaoProps, @Response() response: any) {
    try {
      const data = await this.permissaoService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: PermissaoProps, @Response() response: any) {
    try {
      const data = await this.permissaoService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
