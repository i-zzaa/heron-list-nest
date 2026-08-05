import { UserService } from './user.service';

// Perfis reais (ver PERFIL em src/util/util.ts / consulta ao banco real):
// 1 Developer, 2 Administrador, 3 Coordenadora, 4 Secretária, 5 Terapeuta.
const PERFIL_DEV = { id: 1, nome: 'Developer' };
const PERFIL_ADMIN = { id: 2, nome: 'Administrador' };

describe('UserService', () => {
  const buildService = (overrides: any = {}) => {
    const prisma = {
      usuario: {
        create: jest.fn().mockResolvedValue({
          id: 10,
          nome: 'FULANO',
          login: 'fulano',
          perfil: PERFIL_ADMIN,
        }),
        update: jest.fn().mockResolvedValue({
          id: 10,
          nome: 'FULANO',
          login: 'fulano',
        }),
        findUnique: jest.fn(),
      },
      perfil: {
        findUnique: jest.fn().mockResolvedValue(PERFIL_ADMIN),
      },
      grupoPermissao: {
        findUnique: jest.fn().mockResolvedValue({ id: 3, nome: 'ADM' }),
      },
      terapeuta: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      ...overrides,
    };

    const prismaService = { getPrismaClient: () => prisma } as any;

    return { service: new UserService(prismaService), prisma };
  };

  describe('create', () => {
    it('nunca grava a senha fixa "12345678" e devolve uma senha temporária aleatória', async () => {
      const { service, prisma } = buildService();

      const result: any = await service.create({
        nome: 'fulano',
        login: 'fulano',
        perfilId: PERFIL_ADMIN.id,
      });

      const dataGravada = prisma.usuario.create.mock.calls[0][0].data;

      expect(dataGravada.senha).not.toBe('12345678');
      expect(dataGravada.mustChangePassword).toBe(true);
      expect(dataGravada.grupoPermissaoId).toBeUndefined();
      expect(result.senhaTemporaria).toBeDefined();
      expect(result.senhaTemporaria).not.toBe('12345678');
      expect(result.senha).toBeUndefined();
    });

    it('bloqueia atribuir perfil Developer quando quem chama não é Developer', async () => {
      const { service, prisma } = buildService();
      prisma.perfil.findUnique.mockResolvedValue(PERFIL_DEV);
      prisma.usuario.findUnique.mockResolvedValue({
        perfil: { nome: 'Administrador' },
      });

      await expect(
        service.create(
          { nome: 'x', login: 'x', perfilId: PERFIL_DEV.id },
          'admin.comum',
        ),
      ).rejects.toThrow(/Developer/);
    });

    it('permite atribuir perfil Developer quando quem chama já é Developer', async () => {
      const { service, prisma } = buildService();
      prisma.perfil.findUnique.mockResolvedValue(PERFIL_DEV);
      prisma.usuario.findUnique.mockResolvedValue({
        perfil: { nome: 'Developer' },
      });
      prisma.usuario.create.mockResolvedValue({
        id: 11,
        nome: 'X',
        login: 'x',
        perfil: PERFIL_DEV,
      });

      await expect(
        service.create(
          { nome: 'x', login: 'x', perfilId: PERFIL_DEV.id },
          'dev.user',
        ),
      ).resolves.toMatchObject({ id: 11 });
    });
  });

  describe('update', () => {
    it('ignora grupoPermissaoId enviado no payload (rota separada cuida disso)', async () => {
      const { service, prisma } = buildService();

      await service.update({
        id: 10,
        nome: 'Fulano',
        login: 'fulano',
        ativo: true,
        perfilId: PERFIL_ADMIN.id,
        grupoPermissaoId: 999,
      });

      const dataGravada = prisma.usuario.update.mock.calls[0][0].data;
      expect(dataGravada.grupoPermissaoId).toBeUndefined();
    });
  });

  describe('updateGrupoPermissao', () => {
    it('rejeita grupoPermissaoId inexistente', async () => {
      const { service, prisma } = buildService();
      prisma.grupoPermissao.findUnique.mockResolvedValue(null);

      await expect(service.updateGrupoPermissao(10, 999)).rejects.toThrow(
        /não existe/,
      );
    });

    it('aceita null para remover o usuário de qualquer grupo', async () => {
      const { service, prisma } = buildService();

      await service.updateGrupoPermissao(10, null as any);

      expect(prisma.grupoPermissao.findUnique).not.toHaveBeenCalled();
      expect(prisma.usuario.update.mock.calls[0][0].data.grupoPermissaoId).toBeNull();
    });

    it('grava o grupo quando ele existe', async () => {
      const { service, prisma } = buildService();

      await service.updateGrupoPermissao(10, 3);

      expect(prisma.usuario.update.mock.calls[0][0].data.grupoPermissaoId).toBe(
        3,
      );
    });
  });

  describe('updatePassword (reset por terceiro)', () => {
    it('gera senha aleatória, marca mustChangePassword e devolve a senha temporária', async () => {
      const { service, prisma } = buildService();

      const result = await service.updatePassword(10);

      const dataGravada = prisma.usuario.update.mock.calls[0][0].data;
      expect(dataGravada.mustChangePassword).toBe(true);
      expect(dataGravada.senha).not.toBe('12345678');
      expect(result.senhaTemporaria).toBeDefined();
    });
  });

  describe('updatePasswordLogin (troca pelo próprio usuário)', () => {
    it('limpa mustChangePassword ao trocar a senha', async () => {
      const { service, prisma } = buildService();

      await service.updatePasswordLogin('fulano', { senha: 'novaSenha123' });

      const dataGravada = prisma.usuario.update.mock.calls[0][0].data;
      expect(dataGravada.mustChangePassword).toBe(false);
    });
  });
});
