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
