import { Injectable } from '@nestjs/common';

import { Client, createClientAsync } from 'soap';

@Injectable()
export class OtrsService {
  private client: Client;
  private url =
    'https://support.i9atech.com/otrs/nph-genericinterface.pl/Webservice/wbx_soap';

  async createSession(username: string, password: string) {
    try {
      if (!this.client) {
        console.log(this.url);

        this.client = await createClientAsync(this.url);
      }
      console.log('aqui 1');
      const args = {
        CustomerUserLogin: username,
        Password: password,
      };

      const response = await this.client.CreateAccessToken(args);

      console.log('aqui', response);
    } catch (error) {
      console.log(error.message);
    }
  }
}
