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
import { normalizePageSize } from 'src/util/pagination';
import { UserService } from './user.service';
import { UserRequestProps } from './user.interface';
import { responseSuccess, responseError } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_USUARIOS_BOTAO_CADASTRAR')
  @Post()
  async create(@Body() body: UserRequestProps, @Response() response: any) {
    try {
      const data = await this.userService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_USUARIOS_LISTA_BOTAO_EDITAR')
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
      const pageSize = normalizePageSize(Number(req.query.pageSize));

      const data = await this.userService.getAll(page, pageSize);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Get(':search')
  async search(@Param('search') search: string, @Response() response: any) {
    try {
      const data = await this.userService.search(search);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // Reset de senha de OUTRO usuário (por id) exige a tag — diferente de
  // "reset-senha" (sem id) e "reset-senha/:login" logo abaixo, que são o
  // próprio usuário trocando a própria senha e continuam sem tag nenhuma.
  @UseGuards(PermissionsGuard)
  @RequirePermission('CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA')
  @Get('reset-senha/:id')
  async updatePassword(@Param('id') id: number, @Response() response: any) {
    try {
      const data = await this.userService.updatePassword(id);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put('reset-senha')
  async put(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.userService.updatePasswordLogin(
        req.user?.username,
        req.body,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @Put('reset-senha/:login')
  async updatePasswordLogin(@Request() req: any, @Response() response: any) {
    try {
      const data = await this.userService.updatePasswordLogin(
        req.user?.username,
        req.body,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
