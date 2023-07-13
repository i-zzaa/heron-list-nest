import { Injectable, Req } from '@nestjs/common';
import {
  TicketCreateProps,
  TicketGetProps,
  TicketServiceInterface,
} from './ticket.interface';
import { PrismaService } from 'src/prisma.service';
import { setIconStatus } from 'src/util/util';
import { formatDate } from 'src/util/format-date';

@Injectable()
export class TicketService implements TicketServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: TicketCreateProps) {
    // return await this.prismaService.ticket.create({
    //   data: body,
    // });
  }

  async get({ pageSize, currentPage }: any, userId: number) {
    const response: any[] = await this.prismaService.ticket.findMany({
      select: {
        id: true,
        tn: true,
        title: true,
        create_time: true,
        ticket_priority: {
          select: {
            name: true,
          },
        },
        ticket_type: {
          select: {
            name: true,
          },
        },
        ticket_state: {
          select: {
            name: true,
          },
        },
        queue: {
          select: {
            name: true,
          },
        },
        responsible_user_id: true,
      },
      orderBy: {
        create_time: 'asc',
      },
      where: {
        user_id: userId,
      },
    });

    const data = await Promise.all(
      response.map((ticket: any) => {
        const item = setIconStatus(ticket);
        const date = formatDate(ticket.create_time);

        return {
          id: ticket.id,
          title: ticket.title,
          ticket: ticket.tn,
          status: ticket.ticket_state.name,

          type: ticket.ticket_type.name,
          priority: ticket.ticket_priority.name,
          attendant: '',
          queue: ticket.queue.name,
          date,
          userId: userId,
          color: item.color,
          icon: item.icon,

          detail: [
            {
              id: 2,
              ticketId: 3,

              title: 'Teste',
              attendant: 'teste',
              queue: '',
              detalhe: '',
              date: '',
            },
          ],
        };
      }),
    );

    return {
      data,
      totalPages: data.length,
      currentPage: currentPage,
    };
  }
  async search(word: string) {
    // return new Promise((resolve, reject) => {
    //   const filter = this.tickets.filter(
    //     ({ ticket, title, status }: any) =>
    //       ticket.includes(word) ||
    //       title.includes(word) ||
    //       status.includes(word),
    //   );
    //   resolve(filter);
    // });
  }
}
