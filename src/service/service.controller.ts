import { Controller, Get, Param } from '@nestjs/common';
import { ServiceService } from './service.service';

@Controller('servicos')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get(':catalogId')
  get(@Param('catalogId') catalogId: number) {
    return this.serviceService.get(Number(catalogId));
  }

  @Get(':search/:catalogId')
  search(
    @Param('search') search: string,
    @Param('catalogId') catalogId: number,
  ) {
    return this.serviceService.search(search, catalogId);
  }
}
