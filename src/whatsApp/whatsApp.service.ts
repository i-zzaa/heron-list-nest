import { Injectable } from '@nestjs/common';
import { VenomBotAdapter } from './whatsapp.adapter';
import { AgendaService } from 'src/agenda/agenda.service';
import { formatDateHours, getDateBeforeDay } from 'src/util/format-date';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly venomBotAdapter: VenomBotAdapter,
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
      eventos.map(
        ({ paciente, terapeuta, localidade, dataInicio, start }: any) =>
          this.sendMessage(
            paciente.telefone,
            paciente.nome,
            paciente.responsavel,
            terapeuta.usuario.nome,
            localidade.casa + localidade.sala,
            formatDateHours(start, dataInicio),
          ),
      ),
    );
  }

  async sendMessage(
    phoneNumber: string,
    pacienteNome: string,
    responsavel: string,
    terapeuta: string,
    localidade: string,
    dataHora: string,
  ) {
    const message = `Passando para confirmar o horário do ${pacienteNome}.\n\nData: ${dataHora}\nLocalidade: ${localidade}\nTerapeuta: ${terapeuta}\n\n
    ⚠️ O cancelamento após 24h para o atendimento será cobrado.
    `;

    const to = `55${Number(phoneNumber)}@c.us`; // Substitua pelo número real do destinatário

    await this.venomBotAdapter.sendMessage(
      to,
      `Boa tarde, ${responsavel}!`,
      message,
    );
  }
}
