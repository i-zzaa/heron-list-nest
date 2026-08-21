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
