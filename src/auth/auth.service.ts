import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserProps } from 'src/users/user.interface';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: UserProps) {
    const payload = {
      sub: user.id,
      username: user.login,
      id: user.id,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        username: user.first_name,
        id: user.id,
      },
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findUserAuth(username);

      if (!user) return null;

      const hashedPassword = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');

      if (user && user.pw === hashedPassword) {
        const { pw, ...result } = user;
        return result;
      }
    } catch (error) {
      return null;
    }
  }
}
