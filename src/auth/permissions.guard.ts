import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERFIL } from 'src/util/util';
import { PERMISSION_KEY } from './require-permission.decorator';

/**
 * Autorização por tag, finalmente viável agora que o catálogo real de
 * permissões (`Permissao`/`GrupoPermissao`/`GrupoPermissaoOnPermissao`) foi
 * trazido para o seed. As tags do sistema são de granularidade de UI
 * (menu/botão/campo — ex.: `CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA`),
 * não de rota de API 1:1; por isso este guard só foi aplicado nos
 * endpoints onde o mapeamento tag → ação é inequívoco (ver controllers).
 * Rotas sem `@RequirePermission` não são afetadas (`canActivate` retorna
 * `true` direto). Perfil "Developer" (mesmo bypass já usado no login, em
 * `auth.service.ts`) sempre passa.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || !required.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const login = request.user?.username;

    if (!login) {
      // AuthGuard('jwt') já deveria ter barrado antes disso rodar.
      return false;
    }

    const prisma = this.prismaService.getPrismaClient();
    const usuario = await prisma.usuario.findUnique({
      where: { login },
      select: {
        perfil: { select: { nome: true } },
        grupo: {
          select: {
            permissoes: { select: { permissao: { select: { cod: true } } } },
          },
        },
      },
    });

    if (!usuario) {
      return false;
    }

    if (usuario.perfil?.nome === PERFIL.dev) {
      return true;
    }

    const tags = (usuario.grupo?.permissoes || []).map(
      (item: any) => item.permissao.cod,
    );

    const permitido = required.some((cod) => tags.includes(cod));

    if (!permitido) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    return true;
  }
}
