import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalogo')
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
