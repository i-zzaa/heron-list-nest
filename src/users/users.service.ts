import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'nestjs-soap';

@Injectable()
export class UsersService {
  // constructor() {} // private readonly soapService: Client, // @Inject(process.env.SOAP_CLIENT_NAME)

  private readonly users = [
    {
      userId: 1,
      username: 'andressa.novaes',
      password: '12345678',
    },
    {
      userId: 2,
      username: 'root.localhost',
      password: '123456',
    },
    {
      userId: 3,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string, password: string): Promise<any | undefined> {
    console.log('loooooog');

    return this.users.find((user: any) => user.username === username);
    // return new Promise((resolve, reject) => {
    //   this.soapService.TicketConnector(
    //     { CustomerUserLogin: username, Password: password },
    //     (err: any, res: any) => {
    //       if (res) {
    //         resolve(res);
    //       } else {
    //         reject(err);
    //       }
    //     },
    //   );
    // });
  }
}
