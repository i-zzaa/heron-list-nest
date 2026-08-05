import { PrismaService } from 'src/prisma/prisma.service';
import { PERFIL } from 'src/util/util';
import { getPrismaClient } from 'src/util/crud';

// Cache bem curto (5s) da identidade+permissões de quem está logado.
// Antes, `PermissionsGuard` e `userHasPermission` faziam a mesma consulta
// (usuario -> perfil + grupo + permissoes) cada um por conta própria — numa
// única requisição isso já dava consultas duplicadas; com o guard agora
// presente em ~40 rotas (rodada 6), essa consulta repetida virou uma fração
// perceptível do tempo de resposta (banco remoto, ~30ms por ida mesmo com a
// conexão já aberta). 5s é curto o bastante pra uma mudança de permissão ou
// de `mustChangePassword` feita "agora" valer, na prática, quase imediato —
// não é um cache de sessão, é só pra não repetir a mesma leitura dentro da
// mesma rajada de requisições.
const TTL_MS = 5000;

export interface UsuarioPermissoes {
  mustChangePassword: boolean;
  perfilNome: string | null;
  tags: string[];
}

const cache = new Map<string, { valor: UsuarioPermissoes | null; expiraEm: number }>();

async function buscarNoBanco(
  prismaService: PrismaService,
  login: string,
): Promise<UsuarioPermissoes | null> {
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
    return null;
  }

  return {
    mustChangePassword: !!usuario.mustChangePassword,
    perfilNome: usuario.perfil?.nome ?? null,
    tags: (usuario.grupo?.permissoes || []).map(
      (item: any) => item.permissao.cod,
    ),
  };
}

export async function getUsuarioPermissoes(
  prismaService: PrismaService,
  login: string | undefined,
): Promise<UsuarioPermissoes | null> {
  if (!login) {
    return null;
  }

  const cached = cache.get(login);
  if (cached && cached.expiraEm > Date.now()) {
    return cached.valor;
  }

  const valor = await buscarNoBanco(prismaService, login);
  cache.set(login, { valor, expiraEm: Date.now() + TTL_MS });

  return valor;
}

// Chamado sempre que uma ação muda a própria permissão/senha de um usuário
// (reset de senha, troca de grupo/perfil) — pra não deixar a mudança "presa"
// atrás do cache por até 5s.
export function invalidateUsuarioPermissoesCache(login: string) {
  cache.delete(login);
}

export function isDeveloper(perfilNome: string | null): boolean {
  return perfilNome === PERFIL.dev;
}
