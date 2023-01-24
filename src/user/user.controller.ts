import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateUserProps, UserPasswordLoginProps } from './user.interface';
import { UserService } from './user.service';

@Controller('usuarios')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  get(): Promise<any[]> {
    return this.userService.getUsers();
  }

  @Post()
  async createUser(@Body() body: CreateUserProps) {
    return await this.userService.createUser(body);
  }

  @Put()
  update(@Body() body: any) {
    return this.userService.updateUser(body);
  }

  @Get('terapeutas')
  getTerapeuta() {
    return this.userService.getTerapeuta();
  }

  @Get(':search')
  search(@Param('search') search: string) {
    return this.userService.searchUsers(search);
  }

  @Get('reset-senha/:id')
  updatePassword(@Body('userId') userId: number) {
    return this.userService.updatePassword(userId);
  }

  @Put('reset-senha/:login')
  updatePasswordLogin(@Body() body: UserPasswordLoginProps) {
    const { login, senha } = body;
    return this.userService.updatePasswordLogin(login, senha);
  }
}
