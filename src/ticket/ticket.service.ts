import { Injectable } from '@nestjs/common';
import { TicketCreateProps, TicketServiceInterface } from './ticket.interface';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TicketService implements TicketServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: TicketCreateProps) {
    return await this.prismaService.ticket.create({
      data: body,
    });
  }

  async get(userId: number) {
    return await this.prismaService.ticket.findMany({
      orderBy: {
        ticket: 'asc',
      },
      where: {
        userId: userId,
      },
    });
  }
  async search(word: string, userId: number) {
    return await this.prismaService.ticket.findMany({
      orderBy: {
        ticket: 'asc',
      },
      where: {
        userId: userId,
        OR: [
          {
            title: {
              contains: word,
            },
          },
        ],
      },
    });
  }
}
