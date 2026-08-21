import { TerapeutaService } from './terapeuta.service';

describe('TerapeutaService', () => {
  let service: TerapeutaService;

  beforeEach(() => {
    service = new TerapeutaService({} as any, {} as any);
  });

  it('should instantiate the service', () => {
    expect(service).toBeDefined();
  });

  it('should not map sunday to monday working hours', () => {
    expect(
      (service as any).getCargaHorariaDayKey('2026-07-26'),
    ).toBeUndefined();
  });

  it('should map saturday to saturday working hours', () => {
    expect((service as any).getCargaHorariaDayKey('2026-07-25')).toBe('Sábado');
  });

  it('should mark a slot as occupied when an event overlaps that hour', () => {
    const isOccupied = (service as any).isSlotOccupiedByEvent('08:00', {
      data: {
        start: '08:00',
        end: '09:00',
      },
    });

    expect(isOccupied).toBe(true);
  });

  it('should not mark an adjacent slot as occupied by the same event', () => {
    const isOccupied = (service as any).isSlotOccupiedByEvent('07:00', {
      data: {
        start: '08:00',
        end: '09:00',
      },
    });

    expect(isOccupied).toBe(false);
  });

  it('should build free slot using the slot hour in nested data', () => {
    const slot = (service as any).buildFreeSlot('2026-07-27', '15:00', {
      usuario: { nome: 'Teste', id: 38 },
    });

    expect(slot.start).toBe('15:00');
    expect(slot.end).toBe('16:00');
    expect(slot.data).toEqual({
      start: '15:00',
      end: '16:00',
    });
  });
});

describe('TerapeutaService.getDashboardResumo (item 4)', () => {
  it('calcula os agregados a partir dos eventos reais, ignorando vagas livres', async () => {
    const prisma = {
      sessao: {
        findMany: jest.fn().mockResolvedValue([
          { calendarioId: 1, resumo: '<p>Resumo preenchido</p>' },
          { calendarioId: 2, resumo: '<p></p>' }, // vazio (só tag)
          // id 3: sem registro de sessão nenhum -> conta como pendente
        ]),
      },
    };
    const service = new TerapeutaService(
      { getPrismaClient: () => prisma } as any,
      {} as any,
    );

    (service as any).getAvailableTimes = jest.fn().mockResolvedValue([
      { tipo: 'livre', id: 0 }, // deve ser ignorado
      {
        id: 1,
        tipo: 'agendado',
        paciente: { id: 10, nome: 'Paciente A' },
        statusEventos: { codigo: 'atendido', nome: 'Atendido' },
        data: { start: '08:00', end: '09:00' },
        date: '2026-08-20',
      },
      {
        id: 2,
        tipo: 'agendado',
        paciente: { id: 11, nome: 'Paciente B' },
        statusEventos: { codigo: 'atendido', nome: 'Atendido' },
        data: { start: '09:00', end: '10:30' },
        date: '2026-08-21',
      },
      {
        id: 3,
        tipo: 'agendado',
        paciente: { id: 12, nome: 'Paciente C' },
        statusEventos: { codigo: 'atendido', nome: 'Atendido' },
        data: { start: '10:00', end: '10:30' },
        date: '2026-08-21',
      },
      {
        id: 4,
        tipo: 'agendado',
        paciente: { id: 10, nome: 'Paciente A' }, // mesmo paciente do id 1
        statusEventos: { codigo: 'falta', nome: 'Falta' },
        data: { start: '11:00', end: '12:00' },
        date: '2026-08-21',
      },
    ]);

    const resumo = await service.getDashboardResumo(
      38,
      '2026-08-20',
      '2026-08-21',
      'login',
    );

    expect(resumo.totalSessoes).toBe(4); // exclui o slot livre
    expect(resumo.totalPacientes).toBe(3); // A, B, C (A aparece 2x)
    expect(resumo.taxaComparecimento).toBe(75); // 3 atendidos de 4
    expect(resumo.horasAtendidas).toBe('4h'); // 60+90+30+60 = 240min = 4h

    // resumosPendentes: só entre os ATENDIDOS (ids 1,2,3) sem resumo de
    // verdade — id 1 tem resumo preenchido, id 2 tem só tag vazia, id 3
    // não tem registro nenhum.
    expect(resumo.resumosPendentes.map((r: any) => r.id)).toEqual([2, 3]);
  });
});
