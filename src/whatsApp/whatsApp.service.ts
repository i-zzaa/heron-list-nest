// whatsapp.service.ts
import { Injectable } from '@nestjs/common';
import { WhatsappAdapter } from './whatsapp.adapter';
import { AgendaService } from 'src/agenda/agenda.service';
import { getDateBeforeDay } from 'src/util/format-date';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly whatsappAdapter: WhatsappAdapter,
    private readonly agendaService: AgendaService,
  ) {}

  /*
    Chama os eventos e  dispara as mensagens
  */
  async executeAlert() {
    const dataInicio = getDateBeforeDay(2);
    const dataFim = getDateBeforeDay(3);

    const eventos: any = await this.agendaService.getEventsMessage(
      dataInicio,
      dataFim,
    );

    await Promise.all(
      eventos.map(({ paciente }: any) =>
        this.sendMessage(
          paciente.telefone,
          paciente.nome,
          paciente.responsavel,
        ),
      ),
    );
  }

  sendMessage(
    phoneNumber: string,
    pacienteNome: string,
    responsavel: string,
  ): void {
    // Chame a função do adaptador para enviar a mensagem via WhatsApp
    // this.whatsappAdapter.sendMessage(phoneNumber, message);
  }
}
