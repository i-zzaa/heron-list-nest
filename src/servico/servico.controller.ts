import { Controller, Get, Param } from '@nestjs/common';
import { ServicoService } from './servico.service';

@Controller('servico')
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Get(':catalogoId')
  get(@Param('catalogoId') catalogoId: number) {
    return this.servicoService.get(catalogoId);
  }

  @Get(':search/:catalogoId')
  search(
    @Param('search') search: string,
    @Param('catalogoId') catalogoId: number,
  ) {
    return this.servicoService.search(search, catalogoId);
  }
}
