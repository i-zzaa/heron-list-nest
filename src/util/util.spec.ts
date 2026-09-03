import { calcAcertos, TYPE_DTT } from './util';

describe('calcAcertos', () => {
  it('calcula a porcentagem de acertos (C) sobre o total de respostas', () => {
    expect(calcAcertos([TYPE_DTT.c, TYPE_DTT.c, TYPE_DTT.dt, TYPE_DTT.c])).toBe(
      '75.00',
    );
  });

  it('ignora valores null antes de calcular', () => {
    expect(calcAcertos([TYPE_DTT.c, null as any, TYPE_DTT.dt])).toBe('50.00');
  });

  // Sem isso, countC/0 = NaN e "NaN" ia parar na tela (relatório de
  // atividade por dia, entre outros lugares que exibem o valor cru).
  it('devolve "-" (não "NaN") quando não há nenhuma resposta', () => {
    expect(calcAcertos([])).toBe('-');
  });

  it('devolve "-" quando só existem valores null', () => {
    expect(calcAcertos([null as any, null as any])).toBe('-');
  });

  it('devolve "-" quando o array vem undefined', () => {
    expect(calcAcertos(undefined as any)).toBe('-');
  });
});
