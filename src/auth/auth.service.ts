import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

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
