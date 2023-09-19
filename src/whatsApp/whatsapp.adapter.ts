// src/chatbot/chatbot.service.ts

import { Injectable } from '@nestjs/common';
import { create, Whatsapp } from 'venom-bot';
import * as fs from 'fs';

@Injectable()
export class VenomBotAdapter {
  private client: Whatsapp;
  private sessionPath: string = 'session.json';
  private logPath: string = 'log-mwssage.json';

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
      switch (message.text) {
        case '1':
          break;
        default:
          var menu =
            '👋 Olá, como vai? \n\nEm breve estaremos te atendendo. 🥰';
          this.client
            .sendText(message.from, menu)
            .then(() => {})
            .catch((error) => {
              fs.writeFileSync(
                this.logPath,
                JSON.stringify({
                  data: new Date(),
                  message: message.text,
                  from: message.from,
                }),
              );
            });

          break;
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

  async sendMessage(to: string, title: string, message: string) {
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
}
