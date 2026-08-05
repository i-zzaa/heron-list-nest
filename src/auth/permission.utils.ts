import { PrismaService } from 'src/prisma/prisma.service';
import { PERFIL } from 'src/util/util';
import { getPrismaClient } from 'src/util/crud';

/**
 * Checagem de tag de permissão reutilizável fora de um guard — para regras
 * que dependem do estado do próprio recurso (ex.: "só o criador pode
 * excluir, a menos que o evento já tenha sido editado, aí quem tem a tag
 * pode"), que não dá pra expressar só com `@RequirePermission` na rota.
 * Mesma lógica do `PermissionsGuard` (perfil Developer sempre passa).
 */
export async function userHasPermission(
  prismaService: PrismaService,
  login: string | undefined,
  requiredCods: string[],
): Promise<boolean> {
  if (!login) {
    return false;
  }

  const prisma = getPrismaClient(prismaService);
  const usuario = await prisma.usuario.findUnique({
    where: { login },
    select: {
      mustChangePassword: true,
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

  // Mesma trava do PermissionsGuard: troca de senha pendente bloqueia
  // qualquer checagem de permissão, mesmo para Developer.
  if (usuario.mustChangePassword) {
    return false;
  }

  if (usuario.perfil?.nome === PERFIL.dev) {
    return true;
  }

  const tags = (usuario.grupo?.permissoes || []).map(
    (item: any) => item.permissao.cod,
  );

  return requiredCods.some((cod) => tags.includes(cod));
}
