import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSION_KEY } from './require-permission.decorator';

const buildContext = (login?: string) => {
  const request: any = { user: login ? { username: login } : undefined };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
};

describe('PermissionsGuard', () => {
  const buildGuard = (required: string[] | undefined, findUniqueResult: any) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;

    const findUnique = jest.fn().mockResolvedValue(findUniqueResult);
    const prismaService = {
      getPrismaClient: () => ({ usuario: { findUnique } }),
    } as any;

    return new PermissionsGuard(reflector, prismaService);
  };

  it('libera direto quando a rota não declara @RequirePermission', async () => {
    const guard = buildGuard(undefined, null);

    await expect(guard.canActivate(buildContext('alguem'))).resolves.toBe(
      true,
    );
  });

  it('bloqueia quando não há usuário autenticado no request', async () => {
    const guard = buildGuard(['ALGUMA_TAG'], null);

    await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(
      false,
    );
  });

  it('libera perfil Developer mesmo sem a tag', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      perfil: { nome: 'Developer' },
      grupo: null,
    });

    await expect(
      guard.canActivate(buildContext('dev.user')),
    ).resolves.toBe(true);
  });

  it('libera quando o grupo do usuário tem a tag exigida', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      perfil: { nome: 'Administrador' },
      grupo: {
        permissoes: [
          { permissao: { cod: 'CADASTRO_USUARIOS_BOTAO_CADASTRAR' } },
          { permissao: { cod: 'OUTRA_TAG' } },
        ],
      },
    });

    await expect(
      guard.canActivate(buildContext('adm.user')),
    ).resolves.toBe(true);
  });

  it('rejeita com 403 quando o usuário não tem a tag exigida', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      perfil: { nome: 'Terapeuta' },
      grupo: {
        permissoes: [{ permissao: { cod: 'AGENDA' } }],
      },
    });

    await expect(guard.canActivate(buildContext('terapeuta.user'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejeita usuário sem grupo (grupoPermissaoId null) como sem permissão nenhuma', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      perfil: { nome: 'Secretaria' },
      grupo: null,
    });

    await expect(
      guard.canActivate(buildContext('sem.grupo')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloqueia quando o usuário não existe mais no banco', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], null);

    await expect(guard.canActivate(buildContext('fantasma'))).resolves.toBe(
      false,
    );
  });

  it('rejeita com 403 quando mustChangePassword está pendente, mesmo com a tag', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      mustChangePassword: true,
      perfil: { nome: 'Administrador' },
      grupo: {
        permissoes: [
          { permissao: { cod: 'CADASTRO_USUARIOS_BOTAO_CADASTRAR' } },
        ],
      },
    });

    await expect(
      guard.canActivate(buildContext('precisa.trocar')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejeita mustChangePassword mesmo para perfil Developer', async () => {
    const guard = buildGuard(['CADASTRO_USUARIOS_BOTAO_CADASTRAR'], {
      mustChangePassword: true,
      perfil: { nome: 'Developer' },
      grupo: null,
    });

    await expect(
      guard.canActivate(buildContext('dev.trocar')),
    ).rejects.toThrow(ForbiddenException);
  });
});
