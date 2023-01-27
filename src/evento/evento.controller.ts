import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Body,
  Headers,
} from '@nestjs/common';
import { EventoService } from './evento.service';

@Controller('evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Get('mes/:mes/:ano')
  getMonth(@Param() params: any) {
    const { ano, mes } = params;
    return this.eventoService.getMonth({ ano, mes });
  }

  @Get('filter/:mes/:ano')
  getFilter(@Param() params: any, @Query() query: any) {
    return this.eventoService.getFilter(params, query);
  }

  @Post()
  createUser(@Body() body: any, @Headers('login') login: string) {
    return this.eventoService.createEvento(body, login);
  }

  @Put(':id')
  update(@Body() body: any, @Headers('login') login: string) {
    return this.eventoService.updateEvento(body, login);
  }
}
