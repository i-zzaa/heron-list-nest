import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSION_KEY } from './require-permission.decorator';
import { getUsuarioPermissoes, isDeveloper } from './permission-lookup';

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

    const usuario = await getUsuarioPermissoes(this.prismaService, login);

    if (!usuario) {
      return false;
    }

    // Reset de senha/criação de usuário deixa a senha antiga sabida por
    // quem resetou até o usuário trocar. Enquanto isso, bloqueia qualquer
    // rota já protegida por tag (as de maior risco) — inclusive para quem
    // tem perfil Developer, já que o flag só é setado por uma ação
    // deliberada de reset/criação. As rotas de troca de senha propriamente
    // ditas (PUT /usuarios/reset-senha[/:login]) nunca têm
    // `@RequirePermission`, então nunca passam por aqui — não travam a
    // própria saída.
    if (usuario.mustChangePassword) {
      throw new ForbiddenException(
        'Troca de senha obrigatória antes de continuar. Use PUT /usuarios/reset-senha.',
      );
    }

    if (isDeveloper(usuario.perfilNome)) {
      return true;
    }

    const permitido = required.some((cod) => usuario.tags.includes(cod));

    if (!permitido) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    return true;
  }
}
