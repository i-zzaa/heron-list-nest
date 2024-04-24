import { Controller, UseGuards, Post, Request, Response } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { responseError, responseSuccess } from 'src/util/response';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any, @Response() res: any) {
    try {
      const data = await this.authService.login(req.user);
      res.status(200).json(data);
    } catch (error) {
      responseError(res);
    }
    return await this.authService.login(req.user);
  }
}
