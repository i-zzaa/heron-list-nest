import {
  Headers,
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { PermissaoService } from './permissao.service';

@Controller('permissao')
export class PermissaoController {
  constructor(private readonly permissaoService: PermissaoService) {}

  @Get()
  get(@Headers('login') login: string) {
    return this.permissaoService.getPermissaoUser(login);
  }

  @Post()
  createUser(@Body() body: any) {
    return this.permissaoService.createPermissao(body);
  }

  @Put(':id')
  update(@Body() body: any, @Param('id') id: number) {
    return this.permissaoService.updatePermissao(body, id);
  }

  @Get()
  search(@Param('search') search: string) {
    return this.permissaoService.searchPermissao(search);
  }
}
