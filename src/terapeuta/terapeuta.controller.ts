import { Controller, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TerapeutaService } from './terapeuta.service';

@Controller('terapeuta')
export class TerapeutaController {
  constructor(private terapeutaService: TerapeutaService) {}

  @Get('dropdown')
  async getAll() {
    return await this.terapeutaService.getAll();
  }
}
