import {
  Controller,
  UseGuards,
  Post,
  Request,
  Response,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { responseError, responseSuccess } from 'src/util/response';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  buildAccessTokenCookieOptions,
} from './auth-cookie';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any, @Response() res: any) {
    try {
      const data = await this.authService.login(req.user, req.headers.device);

      // Item 10: cookie HttpOnly em paralelo ao accessToken no corpo —
      // ver auth-cookie.ts pro racional completo (é aditivo, não
      // substitui o corpo ainda).
      res.cookie(
        ACCESS_TOKEN_COOKIE_NAME,
        data.accessToken,
        buildAccessTokenCookieOptions(req),
      );

      res.status(200).json(data);
      return data;
    } catch (error) {
      responseError(res, error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logout')
  async logout(@Request() req: any, @Response() res: any) {
    try {
      const data = await this.authService.logout();

      res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, buildAccessTokenCookieOptions(req));

      res.status(200).json(data);
      return data;
    } catch (error) {
      responseError(res, error);
    }
  }
}
