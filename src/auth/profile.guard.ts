import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PROFILE_KEY } from './require-profile.decorator';
import { getUsuarioPermissoes } from './permission-lookup';

/**
 * Restringe uma rota a uma lista fechada de perfis (`Perfil.nome`) — ex.:
 * módulo de dashboard gerencial, só Administrador/Developer. Diferente de
 * `PermissionsGuard` (tags configuráveis por grupo): aqui o cargo em si é
 * a trava, não dá pra liberar via `GrupoPermissaoOnPermissao`. Reusa o
 * mesmo cache de 5s de `getUsuarioPermissoes` (evita duplicar a consulta
 * quando as duas guards estão na mesma rota).
 */
@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || !required.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const login = request.user?.username;

    if (!login) {
      return false;
    }

    const usuario = await getUsuarioPermissoes(this.prismaService, login);

    if (!usuario) {
      return false;
    }

    if (!required.includes(usuario.perfilNome || '')) {
      throw new ForbiddenException(
        'Este módulo é restrito a Administrador/Developer.',
      );
    }

    return true;
  }
}
