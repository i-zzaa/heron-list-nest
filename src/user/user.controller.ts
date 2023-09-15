import {
  Controller,
  UseGuards,
  Post,
  Request,
  Get,
  Param,
  Body,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UserRequestProps } from './user.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() body: UserRequestProps) {
    return await this.userService.create(body);
  }

  @Put()
  async update(@Body() body: UserRequestProps) {
    return await this.userService.update(body);
  }

  @Get()
  async getAll(@Request() req: any) {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    return await this.userService.getUsers(page, pageSize);
  }

  @Get(':search')
  async search(@Param('search') search: string) {
    return await this.userService.search(search);
  }

  @Get('reset-senha/:id')
  async updatePassword(@Param('id') id: number) {
    return await this.userService.updatePassword(id);
  }

  @Put('reset-senha')
  async updatePasswordCurrent(@Request() req: any) {
    return await this.userService.updatePasswordLogin(
      req.headers.login,
      req.body,
    );
  }

  @Put('reset-senha/:login')
  async updatePasswordLogin(@Request() req: any) {
    return await this.userService.updatePasswordLogin(
      req.params.login,
      req.body,
    );
  }
}
