import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ConvenioProps } from './convenio.interface';
import { ConvenioService } from './convenio.service';

@Controller('convenio')
export class ConvenioController {
  constructor(private readonly convenioService: ConvenioService) {}

  @Get()
  get() {
    return this.convenioService.getConvenio();
  }

  @Post()
  createUser(@Body() body: ConvenioProps) {
    return this.convenioService.createConvenio(body);
  }

  @Put(':id')
  update(@Body() body: any, @Param('id') id: number) {
    return this.convenioService.updateConvenio(body, id);
  }

  @Get()
  search(@Param('search') search: string) {
    return this.convenioService.searchConvenio(search);
  }
}
