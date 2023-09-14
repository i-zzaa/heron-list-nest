import { Controller, UseGuards, Post, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('')
export class UserController {
  constructor(private userService: UserService) {}

  // @UseGuards(AuthGuard('local'))
  @Get('usuarios')
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.userService.getUsers(page, pageSize);
  }
}
