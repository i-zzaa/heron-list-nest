import {
  Request,
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketCreateProps } from './ticket.interface';
import { AuthGuard } from '@nestjs/passport';

@Controller('ticket')
@UseGuards(AuthGuard('jwt'))
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  get(@Request() req: any) {
    return this.ticketService.get();
  }

  @Post()
  create(@Body() body: TicketCreateProps) {
    return this.ticketService.create(body);
  }

  @Get(':search/:userId')
  search(@Param('search') search: string, @Param('userId') userId: number) {
    return this.ticketService.search(search, userId);
  }
}
