import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Response,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PerfilService } from './perfil.service';
import { PerfilProps } from './perfil.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { ProfileGuard } from 'src/auth/profile.guard';
import { RequireProfile } from 'src/auth/require-profile.decorator';
import { PERFIL } from 'src/util/util';

@UseGuards(AuthGuard('jwt'))
@Controller('perfil')
export class PerfilController {
  constructor(private perfilService: PerfilService) {}

  // Sem restrição de perfil de propósito: qualquer usuário com permissão
  // pra cadastrar/editar usuário (RECEPCAO inclusive, via GrupoPermissao —
  // não tem relação com Perfil) precisa desse dropdown pra preencher o
  // campo obrigatório Usuario.perfilId.
  @Get('dropdown')
  async dropdown(@Response() response: any) {
    try {
      const data = await this.perfilService.dropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  // Perfil (Perfil.nome) é o que `isDeveloper()` compara pra liberar o
  // bypass total de permissão (ver PermissionsGuard/ProfileGuard) — sem
  // essa trava, qualquer usuário autenticado podia renomear (ou criar) um
  // perfil para "Developer" e virar super-admin na próxima requisição.
  // Restrito por perfil (não por tag configurável) igual ao módulo de
  // dashboard: só quem já é Administrador/Developer pode mexer aqui.
  @UseGuards(ProfileGuard)
  @RequireProfile(PERFIL.admin, PERFIL.dev)
  @Post()
  async create(@Body() body: PerfilProps, @Response() response: any) {
    try {
      const data = await this.perfilService.create(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(ProfileGuard)
  @RequireProfile(PERFIL.admin, PERFIL.dev)
  @Put()
  async put(@Body() body: PerfilProps, @Response() response: any) {
    try {
      const data = await this.perfilService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }

  @UseGuards(ProfileGuard)
  @RequireProfile(PERFIL.admin, PERFIL.dev)
  @Delete(':id')
  async delete(@Param('id') id: string, @Response() response: any) {
    try {
      const data = await this.perfilService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
