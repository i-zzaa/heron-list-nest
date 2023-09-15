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
import { PerfilService } from './perfil.service';
import { PerfilProps } from './perfil.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('perfil')
export class PerfilController {
  constructor(private perfilService: PerfilService) {}

  @Get('dropdown')
  async dropdown() {
    return await this.perfilService.dropdown();
  }

  @Post()
  async create(@Body() body: PerfilProps) {
    return await this.perfilService.create(body);
  }

  @Put()
  async put(@Body() body: PerfilProps) {
    return await this.perfilService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.perfilService.delete(id);
  }
}
