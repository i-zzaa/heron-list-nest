import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Request,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissaoService } from './permissao.service';
import { PermissaoProps } from './permissao.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { ProfileGuard } from 'src/auth/profile.guard';
import { RequireProfile } from 'src/auth/require-profile.decorator';
import { PERFIL } from 'src/util/util';

@UseGuards(AuthGuard('jwt'))
@Controller('permissao')
export class PermissaoController {
  constructor(private permissaoService: PermissaoService) {}

  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.permissaoService.getAll();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // `Permissao.cod` é o próprio texto que PermissionsGuard compara pra
  // liberar uma ação (ver GrupoPermissaoOnPermissao → Permissao.cod). Sem
  // essa trava, qualquer usuário autenticado podia reescrever o cod de uma
  // Permissao que seu grupo já possui pra qualquer tag sensível (ex.:
  // `CADASTRO_USUARIOS_BOTAO_CADASTRAR`) e ganhar aquela ação sem nunca ter
  // sido concedida a ela. Restrito por perfil, igual a `perfil.controller`.
  @UseGuards(ProfileGuard)
  @RequireProfile(PERFIL.admin, PERFIL.dev)
  @Post()
  async create(@Body() body: PermissaoProps, @Response() response: any) {
    try {
      const data = await this.permissaoService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(ProfileGuard)
  @RequireProfile(PERFIL.admin, PERFIL.dev)
  @Put()
  async put(@Body() body: PermissaoProps, @Response() response: any) {
    try {
      const data = await this.permissaoService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
