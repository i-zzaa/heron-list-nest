import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissaoService } from './permissao.service';
import { PermissaoProps } from './permissao.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('permissao')
export class PermissaoController {
  constructor(private permissaoService: PermissaoService) {}

  @Get()
  async dropdown(@Request() req: any) {
    return await this.permissaoService.getPermissaoUser(req.headers.login);
  }

  @Post()
  async create(@Body() body: PermissaoProps) {
    return await this.permissaoService.create(body);
  }

  @Put()
  async put(@Body() body: PermissaoProps) {
    return await this.permissaoService.update(body);
  }
}
