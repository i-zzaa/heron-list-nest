import { buildCreatePayload } from './crud';

describe('buildCreatePayload — contrato de escrita de dropdown (item 6, heron-list-web)', () => {
  it('mantém id cru quando o campo já vem como número', () => {
    const result = buildCreatePayload({ tipoSessaoId: 3 }, ['tipoSessaoId']);

    expect(result).toEqual({ tipoSessaoId: 3 });
  });

  it('extrai .id quando o campo (terminado em "Id") vem como objeto completo de dropdown', () => {
    const result = buildCreatePayload(
      { tipoSessaoId: { id: 3, nome: 'Terapia' } },
      ['tipoSessaoId'],
    );

    expect(result).toEqual({ tipoSessaoId: 3 });
  });

  it('não mexe em campos que não terminam em "Id", mesmo sendo objeto', () => {
    const maintenance = { manual: [], vbmapp: [], portage: [] };

    const result = buildCreatePayload({ maintenance }, ['maintenance']);

    expect(result).toEqual({ maintenance });
  });

  it('não mexe em array, mesmo em campo terminado em "Id"', () => {
    const result = buildCreatePayload({ especialidadeId: [1, 2] }, ['especialidadeId']);

    expect(result).toEqual({ especialidadeId: [1, 2] });
  });

  it('ignora campos fora do whitelist, com ou sem extração', () => {
    const result = buildCreatePayload(
      { tipoSessaoId: { id: 3 }, senha: '123', outro: 'x' },
      ['tipoSessaoId'],
    );

    expect(result).toEqual({ tipoSessaoId: 3 });
  });

  it('devolve o body inteiro quando nenhum campo é passado (comportamento pré-existente)', () => {
    const body = { a: 1, b: 2 };

    expect(buildCreatePayload(body)).toBe(body);
  });
});
