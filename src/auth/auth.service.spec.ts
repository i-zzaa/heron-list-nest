import { AuthService } from './auth.service';

describe('AuthService.login', () => {
  const buildService = () => {
    const jwtService = { sign: jest.fn().mockReturnValue('token-fake') } as any;
    const prismaService = {
      getPrismaClient: () => ({ $connect: jest.fn().mockResolvedValue(undefined) }),
    } as any;

    const service = new AuthService({} as any, jwtService, prismaService);

    return { service };
  };

  const baseUser = {
    id: 1,
    login: 'fulano',
    nome: 'Fulano',
    perfil: { nome: 'Administrador' },
    permissoes: [{ permissao: { cod: 'DEVICE_WEB' } }],
  };

  it('devolve mustChangePassword=true quando o usuário está com troca pendente', async () => {
    const { service } = buildService();

    const result = await service.login(
      { ...baseUser, mustChangePassword: true } as any,
      'DEVICE_WEB' as any,
    );

    expect(result.user.mustChangePassword).toBe(true);
  });

  it('devolve mustChangePassword=false quando não há pendência', async () => {
    const { service } = buildService();

    const result = await service.login(
      { ...baseUser, mustChangePassword: false } as any,
      'DEVICE_WEB' as any,
    );

    expect(result.user.mustChangePassword).toBe(false);
  });

  it('devolve mustChangePassword=false (não undefined) quando o campo nem veio no usuário', async () => {
    const { service } = buildService();

    const result = await service.login({ ...baseUser } as any, 'DEVICE_WEB' as any);

    expect(result.user.mustChangePassword).toBe(false);
  });
});
