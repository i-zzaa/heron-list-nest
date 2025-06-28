import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';

import { UserProps } from 'src/user/user.interface';
import { UserService } from 'src/user/user.service';
import { DeviceProps, PERFIL } from 'src/util/util';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(user: UserProps, device: DeviceProps) {
    const payload = {
      sub: user.id,
      username: user.login,
    };

    const [permissoes, hasPermissionDevice] = await Promise.all([
      user.permissoes?.map(({ permissao }: any) => permissao.cod),
      user.permissoes?.filter(({ permissao }: any) => permissao.cod === device),
    ]);

    if (!hasPermissionDevice.length && user.perfil.nome !== PERFIL.dev)
      throw new Error('Não há permissão para esse módulo');
    console.log('conectou');

    await this.prismaService.getPrismaClient().$connect();

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        login: user.login,
        id: user.id,
        permissoes: permissoes,
        perfil: user.perfil,
        nome: user.nome,
      },
    };
  }

  async logout() {
    await this.prismaService.getPrismaClient().$disconnect();
  }

  async validateUser(login: string, password: string): Promise<any> {
    try {
      const user = await this.userService.findUserAuth(login);

      if (!user) return null;
      const checkPassword = bcrypt.compareSync(password.toString(), user.senha);

      if (user && checkPassword && user.ativo) {
        const { senha, ...result } = user;
        return result;
      }
    } catch (error) {
      return null;
    }
  }
}
