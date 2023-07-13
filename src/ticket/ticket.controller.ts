import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketCreateProps, TicketGetProps } from './ticket.interface';
import { AuthGuard } from '@nestjs/passport';

@Controller('ticket')
@UseGuards(AuthGuard('jwt'))
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  get(@Query() query: TicketGetProps, @Request() req: any) {
    return this.ticketService.get(query, req.user.sub);
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
