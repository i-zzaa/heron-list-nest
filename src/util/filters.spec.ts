import { buildQueryFilter } from './filters';

describe('buildQueryFilter', () => {
  it('ignores cache-busting and unsupported query fields', () => {
    const filter = buildQueryFilter({
      _: '1784749275576',
      start: '2026-07-01',
      terapeutaId: '9',
      pacienteId: '4',
      baixa: 'false',
    });

    expect(filter).toEqual({
      terapeutaId: 9,
      pacienteId: 4,
      baixa: false,
    });
  });

  // POST /baixa/filtro com dataInicio/dataFim no corpo era ignorado
  // silenciosamente (fora da allowlist) — a listagem nunca filtrava por
  // período, mesmo o front sempre mandando os dois campos.
  it('filtra Baixa.dataEvento por período (dataInicio/dataFim)', () => {
    const filter = buildQueryFilter({
      dataInicio: '2026-08-01',
      dataFim: '2026-08-21',
      baixa: 'false',
    });

    expect(filter).toEqual({
      dataEvento: { gte: '2026-08-01', lte: '2026-08-21' },
      baixa: false,
    });
  });

  it('aceita só dataInicio ou só dataFim, sem exigir os dois', () => {
    expect(buildQueryFilter({ dataInicio: '2026-08-01' })).toEqual({
      dataEvento: { gte: '2026-08-01' },
    });
    expect(buildQueryFilter({ dataFim: '2026-08-21' })).toEqual({
      dataEvento: { lte: '2026-08-21' },
    });
  });

  it('rejeita quando dataFim é menor que dataInicio', () => {
    expect(() =>
      buildQueryFilter({ dataInicio: '2026-08-21', dataFim: '2026-08-01' }),
    ).toThrow(/final não pode ser menor/);
  });

  it('aceita dataFim igual a dataInicio (intervalo de 1 dia só)', () => {
    expect(
      buildQueryFilter({ dataInicio: '2026-08-21', dataFim: '2026-08-21' }),
    ).toEqual({ dataEvento: { gte: '2026-08-21', lte: '2026-08-21' } });
  });
});
