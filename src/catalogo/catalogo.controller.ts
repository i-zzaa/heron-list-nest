import { Controller, Get, Param } from '@nestjs/common';
import { CatalogoService } from './catalogo.service';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  get() {
    return this.catalogoService.get();
  }

  @Get(':search')
  search(@Param('search') search: string) {
    return this.catalogoService.search(search);
  }
}
