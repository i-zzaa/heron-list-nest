import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketCreateProps, TicketGetProps } from './ticket.interface';
import { AutheticatedGuard } from 'src/auth/autheticated.guard';

@Controller('ticket')
@UseGuards(AutheticatedGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  get(@Query() query: TicketGetProps) {
    return this.ticketService.get(query);
  }

  @Post()
  create(@Body() body: TicketCreateProps) {
    return this.ticketService.create(body);
  }

  @Get('search/:search')
  search(@Param('search') search: string) {
    return this.ticketService.search(search);
  }
}
