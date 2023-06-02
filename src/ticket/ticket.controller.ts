import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketProps } from './ticket.interface';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get(':userId')
  get(@Param('userId') userId: number) {
    return this.ticketService.get(userId);
  }

  @Post()
  create(@Body() body: TicketProps) {
    return this.ticketService.create(body);
  }

  @Get(':search/:userId')
  search(@Param('search') search: string, @Param('userId') userId: number) {
    return this.ticketService.search(search, userId);
  }
}
