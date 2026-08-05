import {
  getUsuarioPermissoes,
  invalidateUsuarioPermissoesCache,
  isDeveloper,
} from './permission-lookup';

describe('permission-lookup', () => {
  const buildPrismaService = (findUniqueResult: any) => {
    const findUnique = jest.fn().mockResolvedValue(findUniqueResult);
    return {
      prismaService: {
        getPrismaClient: () => ({ usuario: { findUnique } }),
      } as any,
      findUnique,
    };
  };

  it('devolve null sem consultar o banco quando não há login', async () => {
    const { prismaService, findUnique } = buildPrismaService(null);

    const result = await getUsuarioPermissoes(prismaService, undefined);

    expect(result).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('devolve null quando o usuário não existe', async () => {
    const { prismaService } = buildPrismaService(null);

    const result = await getUsuarioPermissoes(prismaService, 'fantasma.cache');

    expect(result).toBeNull();
  });

  it('monta mustChangePassword/perfilNome/tags a partir do usuário encontrado', async () => {
    const { prismaService } = buildPrismaService({
      mustChangePassword: true,
      perfil: { nome: 'Administrador' },
      grupo: {
        permissoes: [
          { permissao: { cod: 'TAG_A' } },
          { permissao: { cod: 'TAG_B' } },
        ],
      },
    });

    const result = await getUsuarioPermissoes(prismaService, 'usuario.cache.1');

    expect(result).toEqual({
      mustChangePassword: true,
      perfilNome: 'Administrador',
      tags: ['TAG_A', 'TAG_B'],
    });
  });

  it('reutiliza o resultado em cache — não bate no banco de novo dentro do TTL', async () => {
    const { prismaService, findUnique } = buildPrismaService({
      mustChangePassword: false,
      perfil: { nome: 'Terapeuta' },
      grupo: null,
    });

    await getUsuarioPermissoes(prismaService, 'usuario.cache.2');
    await getUsuarioPermissoes(prismaService, 'usuario.cache.2');
    await getUsuarioPermissoes(prismaService, 'usuario.cache.2');

    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('invalidateUsuarioPermissoesCache força uma nova consulta na próxima chamada', async () => {
    const { prismaService, findUnique } = buildPrismaService({
      mustChangePassword: false,
      perfil: { nome: 'Terapeuta' },
      grupo: null,
    });

    await getUsuarioPermissoes(prismaService, 'usuario.cache.3');
    invalidateUsuarioPermissoesCache('usuario.cache.3');
    await getUsuarioPermissoes(prismaService, 'usuario.cache.3');

    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('logins diferentes não compartilham cache entre si', async () => {
    const { prismaService, findUnique } = buildPrismaService({
      mustChangePassword: false,
      perfil: { nome: 'Terapeuta' },
      grupo: null,
    });

    await getUsuarioPermissoes(prismaService, 'usuario.cache.4a');
    await getUsuarioPermissoes(prismaService, 'usuario.cache.4b');

    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});

describe('isDeveloper', () => {
  it('true só para o nome exato do perfil Developer', () => {
    expect(isDeveloper('Developer')).toBe(true);
    expect(isDeveloper('Administrador')).toBe(false);
    expect(isDeveloper(null)).toBe(false);
  });
});
