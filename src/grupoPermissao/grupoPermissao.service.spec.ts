import { GrupoPermissaoService } from './grupoPermissao.service';

const buildService = (prisma: any) => {
  const service = new GrupoPermissaoService({} as any);
  (service as any).prismaService = { getPrismaClient: () => prisma };
  return service;
};

describe('GrupoPermissaoService.search (busca por texto da listagem)', () => {
  // GET /grupo-permissoes/adm (ou qualquer outro texto) — antes dessa
  // correção, `search()` filtrava a tabela errada (Permissao, não
  // GrupoPermissao) e nem tinha rota associada no controller.
  it('busca GrupoPermissao pelo nome, achatando permissoesId igual getAll', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        nome: 'Administradores',
        permissoes: [{ permissao: { id: 10 } }, { permissao: { id: 11 } }],
      },
    ]);
    const service = buildService({ grupoPermissao: { findMany } });

    const result = await service.search('adm');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ nome: { contains: 'adm' } }],
          NOT: { nome: { in: ['developer', 'Developer'] } },
        }),
      }),
    );
    expect(result).toEqual([
      { id: 1, nome: 'Administradores', permissoesId: [10, 11] },
    ]);
  });

  it('nunca devolve o grupo Developer na busca', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = buildService({ grupoPermissao: { findMany } });

    await service.search('dev');

    const where = findMany.mock.calls[0][0].where;
    expect(where.NOT).toEqual({ nome: { in: ['developer', 'Developer'] } });
  });
});
