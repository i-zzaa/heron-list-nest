import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { EspecialidadeProps } from './especialidade.interface';
import { EspecialidadeService } from './especialidade.service';

@Controller('especialidade')
export class EspecialidadeController {
  constructor(private readonly especialidadeService: EspecialidadeService) {}

  @Get()
  get() {
    return this.especialidadeService.getEspecialidade();
  }

  @Post()
  createUser(@Body() body: EspecialidadeProps) {
    return this.especialidadeService.createEspecialidade(body);
  }

  @Put(':id')
  update(@Body() body: EspecialidadeProps, @Param('id') id: number) {
    return this.especialidadeService.updateEspecialidade(body, id);
  }

  @Get()
  search(@Param('search') search: string) {
    return this.especialidadeService.searchEspecialidade(search);
  }
}
