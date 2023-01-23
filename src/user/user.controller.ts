import { Controller, Get, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('usuarios')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  get(): Promise<any[]> {
    return this.userService.getUsers();
  }

  @Post()
  createUser(): string {
    return this.userService.createUser();
  }

  @Put()
  update(): string {
    return this.userService.updateUser();
  }

  @Get('terapeutas')
  getTerapeuta(): string {
    return this.userService.getTerapeuta();
  }

  @Get(':search')
  search(): string {
    return this.userService.searchUsers();
  }

  @Get('reset-senha/:id')
  updatePassword(): string {
    return this.userService.updatePassword();
  }

  @Put('reset-senha/:login')
  updatePasswordLogin(): string {
    return this.userService.updatePasswordLogin();
  }
}
