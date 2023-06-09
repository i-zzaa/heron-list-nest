import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { AutheticatedGuard } from 'src/auth/autheticated.guard';

@Controller('servicos')
@UseGuards(AutheticatedGuard)
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
