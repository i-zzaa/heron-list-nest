import { calcularFeriadosNacionais } from './format-date';

describe('calcularFeriadosNacionais', () => {
  it('calcula os feriados fixos e móveis de 2026 corretamente', () => {
    const feriados = calcularFeriadosNacionais(2026);

    // Fixos
    expect(feriados).toContain('2026-01-01');
    expect(feriados).toContain('2026-04-21');
    expect(feriados).toContain('2026-05-01');
    expect(feriados).toContain('2026-09-07');
    expect(feriados).toContain('2026-10-12');
    expect(feriados).toContain('2026-11-02');
    expect(feriados).toContain('2026-11-15');
    expect(feriados).toContain('2026-12-25');

    // Móveis (Páscoa 2026 = 2026-04-05)
    expect(feriados).toContain('2026-02-16'); // Carnaval (segunda)
    expect(feriados).toContain('2026-02-17'); // Carnaval (terça)
    expect(feriados).toContain('2026-04-03'); // Sexta-feira Santa
    expect(feriados).toContain('2026-06-04'); // Corpus Christi
  });

  it('acerta o offset do Carnaval em relação à Páscoa (segunda = -48 dias, terça = -47 dias)', () => {
    const feriados2026 = calcularFeriadosNacionais(2026);
    // Páscoa 2026 = 2026-04-05 (domingo)
    expect(feriados2026).toContain('2026-02-16'); // segunda de carnaval
    expect(feriados2026).toContain('2026-02-17'); // terça de carnaval
  });

  it('calcula a Páscoa corretamente em anos distintos (via feriados móveis)', () => {
    // Páscoa 2024 = 2024-03-31 -> Sexta-feira Santa = 2024-03-29
    expect(calcularFeriadosNacionais(2024)).toContain('2024-03-29');
    // Páscoa 2025 = 2025-04-20 -> Sexta-feira Santa = 2025-04-18
    expect(calcularFeriadosNacionais(2025)).toContain('2025-04-18');
  });
});
