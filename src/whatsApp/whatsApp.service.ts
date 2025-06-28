import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { formatDateHours, getDateBeforeDay } from 'src/util/format-date';
import { create, Whatsapp } from 'venom-bot';
import * as fs from 'fs';
@Injectable()
export class WhatsappService {
  private client: Whatsapp;
  private sessionPath: string = 'session.json';
  private logPath: string = 'log-mwssage.json';

  constructor(private readonly agendaService: AgendaService) {}

  async start() {
    // Verifica se há uma sessão salva
    const sessionData = this.loadSessionData();

    // Inicializa o cliente Venom com a sessão salva ou sem gerar QR code
    this.client = await create(
      'multialcance',
      (base64Qr, asciiQR) => {
        // Handle o QR code aqui, se necessário
        console.log('QR code:', asciiQR);
      },
      (statusFind) => {
        console.log(statusFind);
      },
      {
        disableWelcome: true,
        updatesLog: false,
        session: sessionData, // Atribui a sessão carregada, se existir
      },
    );

    // Se houver sessão salva, não será necessário salvar novamente
    if (!sessionData) {
      // Salva a sessão ao autenticar
      this.client.onStateChange(async (state) => {
        if (state === 'CONFLICT' || state === 'UNPAIRED') {
          // Limpe o arquivo da sessão, pois está inválida
          fs.unlinkSync(this.sessionPath);
        } else if (state === 'CONNECTED') {
          // Salva a sessão
          const session = await this.client.session;
          fs.writeFileSync(this.sessionPath, JSON.stringify(session));
        }
      });
    }

    // Lidere com as mensagens recebidas
    this.client.onMessage(async (message: any) => {
      // Lide com a mensagem recebida aqui
      if (!message.isGroupMsg) {
        switch (message.text) {
          case '1':
            break;
          default:
            // var menu =
            //   '👋 Olá, como vai? \n\nEm breve estaremos te atendendo. 🥰';
            // this.client
            //   .sendText(message.from, menu)
            //   .then(() => {})
            //   .catch((error) => {
            //     fs.writeFileSync(
            //       this.logPath,
            //       JSON.stringify({
            //         data: new Date(),
            //         message: message.text,
            //         from: message.from,
            //       }),
            //     );
            //   });

            break;
        }
      }
    });
  }

  private loadSessionData(): any {
    if (fs.existsSync(this.sessionPath)) {
      const sessionJson = fs.readFileSync(this.sessionPath, 'utf-8');
      return JSON.parse(sessionJson);
    }
    return null;
  }

  async sendMessageWhatsapp(to: string, title: string, message: string) {
    if (!this.client) {
      throw new Error('Cliente não inicializado.');
    }
    const buttons: any = [
      {
        buttonText: {
          displayText: 'CONFIRMAR',
        },
      },
      {
        buttonText: {
          displayText: 'CANCELAR',
        },
      },
    ];

    await this.client
      .sendButtons(to, title, buttons, message)
      .then((result) => {
        console.log('Result: ', result); //return object success
      })
      .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
      });
  }

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
            paciente.telefone.replace(/\D/g, ''),
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

    const to = `55${phoneNumber}@c.us`; // Substitua pelo número real do destinatário

    await this.sendMessageWhatsapp(to, `Boa tarde, ${responsavel}!`, message);
  }
}
