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

  async get() {
    // return await this.prismaService.ticket.findMany({
    //   orderBy: {
    //     ticket: 'asc',
    //   },
    //   where: {
    //     userId: userId,
    //   },
    // });

    return new Promise((resolve, reject) => {
      resolve([
        {
          id: 1,
          ticket: '202303015000057',
          title: '[PORTAL] Solicitação de Atendimento:: teste',
          tipo: 'Requisição',
          status: 'Reaberto',
          prioridade: '3 Média',
          date: '01/03/2023 12:01:07',
          detail: [
            {
              title: 'Nota 1',
              status: 'Reaberto',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              title: 'Nota 2',
              status: 'Resolvido',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              title: 'Nota 3',
              status: 'Novo',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
          ],
        },
        {
          id: 2,
          ticket: '202112085000024',
          title: 'Teste',
          tipo: 'Solicitação',
          status: 'Encerrado',
          prioridade: '3 Média',
          date: '17/05/2021 15:25:00',
          detail: [
            {
              status: 'Reaberto',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Resolvido',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Novo',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
          ],
        },
        {
          id: 3,
          ticket: '202112085000024',
          title: 'Teste',
          tipo: 'Solicitação',
          status: 'Reaberto',
          prioridade: '3 Média',
          date: '17/05/2021 15:25:00',
          detail: [
            {
              status: 'Reaberto',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Resolvido',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Novo',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
          ],
        },
        {
          id: 4,
          ticket: '202112085000024',
          title: 'Teste',
          tipo: 'Solicitação',
          status: 'Reaberto',
          prioridade: '3 Média',
          date: '17/05/2021 15:25:00',
          detail: [
            {
              status: 'Reaberto',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Resolvido',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Novo',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
          ],
        },
        {
          id: 4,
          ticket: '202112085000024',
          title: 'Teste',
          tipo: 'Solicitação',
          status: 'Reaberto',
          prioridade: '3 Média',
          date: '17/05/2021 15:25:00',
          detail: [
            {
              status: 'Reaberto',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Resolvido',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
            {
              status: 'Novo',
              fila: 'Prodam - NOC',
              atendente: 'Leonardo Lima',
              detalhe:
                '[202303015000057] Observação sobre o ticket: [Reabertura de Ticket] Oi atendimento, atendimento Prodam escreveu: > [Reabertura de Ticket]: > CHamado nao resolvido [1]http://otrs-customer-prodam.ios.com.br/ Desenvolvido por OTRS 6 [1] http://otrs-customer-prodam.ios.com.br/',
              date: '01/03/2023 12:11:35',
            },
          ],
        },
      ]);
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
