import {
  Controller,
  UseGuards,
  Post,
  Request,
  Get,
  Param,
  Body,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UserRequestProps } from './user.interface';
import { responseSuccess, responseError } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() body: UserRequestProps, @Response() response: any) {
    try {
      const data = await this.userService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put()
  async update(@Body() body: UserRequestProps, @Response() response: any) {
    try {
      const data = await this.userService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, 'Não foi possível atualiar o usuário!');
    }
  }

  @Get()
  async getAll(@Request() req: any, @Response() response: any) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const data = await this.userService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.userService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Get('reset-senha/:id')
  async updatePassword(@Param('id') id: number, @Response() response: any) {
    try {
      const data = await this.userService.updatePassword(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put('reset-senha')
  async put(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.userService.updatePasswordLogin(
        req.headers.login,
        req.body,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Put('reset-senha/:login')
  async updatePasswordLogin(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.userService.updatePasswordLogin(
        req.headers.login,
        req.body,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
