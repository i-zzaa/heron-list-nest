import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'andressa.novaes',
      password: '12345678',
    },
    {
      userId: 2,
      username: 'atendimento.prodam',
      password: 'Pr0d@m@2021',
    },
    {
      userId: 3,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<any | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
