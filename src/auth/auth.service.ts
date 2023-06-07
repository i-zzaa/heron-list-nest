import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserProps } from 'src/users/user.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: UserProps) {
    const payload = {
      sub: user.id,
      username: user.username,
    };

    return {
      token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findOne(username, pass);
      if (user && user.password === pass) {
        const { password, ...result } = user;
        return result;
      }
    } catch (error) {
      return null;
    }
  }
}
