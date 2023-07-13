import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('servicos')
@UseGuards(AuthGuard('jwt'))
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get(':catalogCod')
  get(@Param('catalogCod') catalogCod: string) {
    return this.serviceService.get(catalogCod);
  }

  @Get(':search/:catalogCod')
  search(
    @Param('search') search: string,
    @Param('catalogCod') catalogCod: string,
  ) {
    return this.serviceService.search(search, catalogCod);
  }
}
