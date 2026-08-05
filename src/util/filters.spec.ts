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
});
