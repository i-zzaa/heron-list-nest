import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PerfilProps } from './perfil.interface';
import { PerfilService } from './perfil.service';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  get() {
    return this.perfilService.getPerfil();
  }

  @Post()
  createUser(@Body() body: any) {
    return this.perfilService.createPerfil(body);
  }

  @Put(':id')
  update(@Body() body: PerfilProps, @Param('id') id: number) {
    return this.perfilService.updatePerfil(body, id);
  }

  @Post()
  search(@Param('search') search: string) {
    return this.perfilService.searchPerfil(search);
  }
}
