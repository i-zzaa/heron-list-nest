import { Body, Controller, Post } from '@nestjs/common';
import { AuthProps } from './auth.interface';
import { AuthService } from './auth.service';

@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() body: AuthProps) {
    return await this.authService.loginService(body);
  }
}
