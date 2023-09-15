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
import { FuncaoService } from './funcao.service';
import { FuncaoProps } from './funcao.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('funcao')
export class FuncaoController {
  constructor(private funcaoService: FuncaoService) {}

  @Get('dropdown')
  async getAll() {
    return await this.funcaoService.dropdown();
  }

  @Post()
  async create(@Body() body: FuncaoProps) {
    return await this.funcaoService.create(body);
  }

  @Put()
  async put(@Body() body: FuncaoProps) {
    return await this.funcaoService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.funcaoService.delete(id);
  }
}
