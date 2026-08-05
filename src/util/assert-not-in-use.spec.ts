import { assertEntidadeNaoEstaEmUso } from './assert-not-in-use';

describe('assertEntidadeNaoEstaEmUso', () => {
  it('não lança nada quando nenhuma checagem encontra uso', async () => {
    const prisma = {
      calendario: { count: jest.fn().mockResolvedValue(0) },
      terapeuta: { count: jest.fn().mockResolvedValue(0) },
    };

    await expect(
      assertEntidadeNaoEstaEmUso(
        prisma,
        [
          { model: 'calendario', where: { especialidadeId: 1 } },
          { model: 'terapeuta', where: { especialidadeId: 1 } },
        ],
        'em uso',
      ),
    ).resolves.toBeUndefined();
  });

  it('lança a mensagem informada quando qualquer checagem encontra uso', async () => {
    const prisma = {
      calendario: { count: jest.fn().mockResolvedValue(0) },
      terapeuta: { count: jest.fn().mockResolvedValue(3) },
    };

    await expect(
      assertEntidadeNaoEstaEmUso(
        prisma,
        [
          { model: 'calendario', where: { especialidadeId: 1 } },
          { model: 'terapeuta', where: { especialidadeId: 1 } },
        ],
        'especialidade em uso',
      ),
    ).rejects.toThrow('especialidade em uso');
  });

  it('passa o `where` certo para cada model', async () => {
    const calendarioCount = jest.fn().mockResolvedValue(0);
    const prisma = { calendario: { count: calendarioCount } };

    await assertEntidadeNaoEstaEmUso(
      prisma,
      [{ model: 'calendario', where: { funcaoId: 7 } }],
      'em uso',
    );

    expect(calendarioCount).toHaveBeenCalledWith({ where: { funcaoId: 7 } });
  });
});
