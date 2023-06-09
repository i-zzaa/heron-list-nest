import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AutheticatedGuard } from 'src/auth/autheticated.guard';

@Controller('catalogo')
@UseGuards(AutheticatedGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  get() {
    return this.catalogService.get();
  }

  @Get(':search')
  search(@Param('search') search: string) {
    return this.catalogService.search(search);
  }
}
