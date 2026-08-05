import { PrismaService } from 'src/prisma/prisma.service';
import { getUsuarioPermissoes, isDeveloper } from './permission-lookup';

/**
 * Checagem de tag de permissão reutilizável fora de um guard — para regras
 * que dependem do estado do próprio recurso (ex.: "só o criador pode
 * excluir, a menos que o evento já tenha sido editado, aí quem tem a tag
 * pode"), que não dá pra expressar só com `@RequirePermission` na rota.
 * Mesma lógica do `PermissionsGuard` (perfil Developer sempre passa, e
 * mustChangePassword pendente bloqueia) — agora as duas compartilham a
 * mesma consulta cacheada em vez de bater no banco cada uma por conta
 * própria (ver `permission-lookup.ts`).
 */
export async function userHasPermission(
  prismaService: PrismaService,
  login: string | undefined,
  requiredCods: string[],
): Promise<boolean> {
  const usuario = await getUsuarioPermissoes(prismaService, login);

  if (!usuario) {
    return false;
  }

  // Mesma trava do PermissionsGuard: troca de senha pendente bloqueia
  // qualquer checagem de permissão, mesmo para Developer.
  if (usuario.mustChangePassword) {
    return false;
  }

  if (isDeveloper(usuario.perfilNome)) {
    return true;
  }

  return requiredCods.some((cod) => usuario.tags.includes(cod));
}
