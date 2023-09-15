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
import { ConvenioService } from './convenio.service';
import { ConvenioProps } from './convenio.interface';

// @UseGuards(AuthGuard('jwt'))
@Controller('convenio')
export class ConvenioController {
  constructor(private convenioService: ConvenioService) {}

  @Get('dropdown')
  async getAll() {
    return await this.convenioService.dropdown();
  }

  @Post()
  async create(@Body() body: ConvenioProps) {
    return await this.convenioService.create(body);
  }

  @Put()
  async put(@Body() body: ConvenioProps) {
    return await this.convenioService.update(body);
  }

  @Delete(':id')
  async delete(@Param() id: number) {
    return await this.convenioService.delete(id);
  }
}
