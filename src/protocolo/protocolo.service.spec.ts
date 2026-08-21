import { ProtocoloService } from './protocolo.service';

describe('ProtocoloService.mergeAtividadesVBMapp (ordenação por id)', () => {
  const buildService = () => new ProtocoloService({} as any);

  it('ordena os itens de cada programa por id, independente da ordem de chegada do banco', () => {
    const service = buildService();

    // Catálogo (list1 — vem de vbmapDropdown, sem orderBy) fora de ordem.
    const dropdown = {
      Mando: [
        { id: 3, nome: 'item 3' },
        { id: 1, nome: 'item 1' },
        { id: 5, nome: 'item 5' },
      ],
    };

    // Respostas já registradas (list2 — vem de filterVbmapp, orderBy
    // createdAt desc) também fora de ordem, como reproduzido com dados
    // reais do paciente 79 (retornava [4, 2, 5, 1, 3]).
    const preenchidoLista = {
      Mando: [
        { id: 4, nome: 'item 4', selected: '0.5' },
        { id: 2, nome: 'item 2', selected: '1' },
        { id: 5, nome: 'item 5', selected: '1' },
        { id: 1, nome: 'item 1', selected: '1' },
        { id: 3, nome: 'item 3', selected: '1' },
      ],
    };

    const result: any = service.mergeAtividadesVBMapp(dropdown, preenchidoLista);

    expect(result.Mando.map((item: any) => item.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('prevalece o item já respondido (list2) sobre o catálogo (list1) quando o id se repete', () => {
    const service = buildService();

    const dropdown = { Mando: [{ id: 1, nome: 'item 1' }] };
    const preenchidoLista = {
      Mando: [{ id: 1, nome: 'item 1', selected: '1' }],
    };

    const result: any = service.mergeAtividadesVBMapp(dropdown, preenchidoLista);

    expect(result.Mando).toEqual([{ id: 1, nome: 'item 1', selected: '1' }]);
  });

  it('combina programas presentes em só um dos dois lados', () => {
    const service = buildService();

    const dropdown = { Tato: [{ id: 6, nome: 'item 6' }] };
    const preenchidoLista = {
      Mando: [{ id: 1, nome: 'item 1', selected: '1' }],
    };

    const result: any = service.mergeAtividadesVBMapp(dropdown, preenchidoLista);

    expect(Object.keys(result).sort()).toEqual(['Mando', 'Tato']);
    expect(result.Tato.map((item: any) => item.id)).toEqual([6]);
    expect(result.Mando.map((item: any) => item.id)).toEqual([1]);
  });
});

describe('ProtocoloService.filterMeta — excludeKeys (item 8)', () => {
  const buildService = (portageTree: any) => {
    const prisma = {
      portage: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          respostaPortage: portageTree,
          paciente: { id: 79, nome: 'Paciente' },
        }),
      },
    };

    const service = new ProtocoloService({ getPrismaClient: () => prisma } as any);

    return { service };
  };

  it('poda recursivamente os nós marcados em excludeKeys, sem afetar os demais', async () => {
    // filterDataBySelected/convertToTreeStructure exigem `selected` nas
    // atividades (ver protocolo.service.ts) — payload mínimo pra chegar
    // numa árvore com pelo menos 2 metas dentro de uma faixa etária.
    const portageTree = {
      Cognicao: {
        '0 a 1': [
          { id: 1, nome: 'Meta A', selected: '0.5' },
          { id: 2, nome: 'Meta B', selected: '0' },
        ],
      },
    };

    const { service } = buildService(portageTree);

    const semFiltro: any = await service.filterMeta({
      protocoloId: 1,
      pacienteId: 79,
    });

    const keyMetaA = semFiltro[0].children[0].key;
    const keyMetaB = semFiltro[0].children[1].key;

    const comFiltro: any = await service.filterMeta({
      protocoloId: 1,
      pacienteId: 79,
      excludeKeys: String(keyMetaA),
    });

    const keysRestantes = comFiltro[0].children.map((meta: any) => meta.key);

    expect(keysRestantes).not.toContain(keyMetaA);
    expect(keysRestantes).toContain(keyMetaB);
  });
});

describe('ProtocoloService.pruneExcludedKeys — semântica exata do front (luck/src/util/tree.ts)', () => {
  const service = new ProtocoloService({} as any);

  it('exclui uma folha pela própria key', () => {
    const arvore = [{ key: 'a', children: [{ key: 'a-1' }, { key: 'a-2' }] }];

    const podada = (service as any).pruneExcludedKeys(
      arvore,
      new Set(['a-1']),
    );

    expect(podada[0].children.map((c: any) => c.key)).toEqual(['a-2']);
  });

  it('NÃO remove um galho só por ter a própria key excluída — só desaparece quando fica sem filhos', () => {
    const arvore = [
      { key: 'galho-excluido', children: [{ key: 'folha-1' }] },
      { key: 'galho-mantido', children: [{ key: 'folha-2' }] },
    ];

    // "galho-excluido" está em excludeKeys, mas tem um filho ("folha-1")
    // que NÃO está — o front nunca compara a key de um nó com filhos
    // contra excludeKeys, só filtra os filhos.
    const podada = (service as any).pruneExcludedKeys(
      arvore,
      new Set(['galho-excluido']),
    );

    expect(podada.map((n: any) => n.key)).toEqual([
      'galho-excluido',
      'galho-mantido',
    ]);
  });

  it('remove o galho quando TODOS os filhos são excluídos (fica vazio)', () => {
    const arvore = [
      { key: 'galho', children: [{ key: 'folha-1' }, { key: 'folha-2' }] },
    ];

    const podada = (service as any).pruneExcludedKeys(
      arvore,
      new Set(['folha-1', 'folha-2']),
    );

    expect(podada).toEqual([]);
  });
});
