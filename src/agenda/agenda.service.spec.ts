import { AgendaService } from './agenda.service';

describe('AgendaService.formatEvents', () => {
  let service: AgendaService;

  beforeEach(() => {
    service = new AgendaService(
      {} as any,
      {
        getUser: jest.fn().mockResolvedValue({ id: 1 }),
      } as any,
      {
        formatLocalidade: jest.fn().mockReturnValue('Localidade'),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should not crash when recurrence metadata is missing', async () => {
    const eventos = [
      {
        id: 1,
        groupId: 'group-1',
        dataInicio: '2026-07-01',
        dataFim: null,
        start: '09:00',
        end: '10:00',
        diasFrequencia: '1',
        exdate: null,
        isExterno: false,
        isChildren: false,
        usuarioId: 1,
        km: '0',
        observacao: '',
        paciente: { id: 10, nome: 'Paciente Teste' },
        modalidade: { id: 1, nome: 'Individual' },
        especialidade: { id: 1, nome: 'Fisioterapia', cor: '#3b82f6' },
        terapeuta: { usuario: { id: 2, nome: 'Terapeuta Teste' } },
        funcao: { id: 1, nome: 'Função' },
        localidade: { id: 1, nome: 'Local' },
        statusEventos: { id: 1, nome: 'Pago' },
        frequencia: null,
        intervalo: null,
      },
    ];

    await expect(
      service.formatEvents(eventos as any, 'login'),
    ).resolves.toEqual(expect.any(Array));
  });

  it('should not crash when locality is missing', async () => {
    const eventos = [
      {
        id: 2,
        groupId: 'group-2',
        dataInicio: '2026-07-02',
        dataFim: null,
        start: '10:00',
        end: '11:00',
        diasFrequencia: '1',
        exdate: null,
        isExterno: false,
        isChildren: false,
        usuarioId: 1,
        km: '0',
        observacao: '',
        paciente: { id: 11, nome: 'Outro Paciente' },
        modalidade: { id: 1, nome: 'Individual' },
        especialidade: { id: 1, nome: 'Fisioterapia', cor: '#3b82f6' },
        terapeuta: { usuario: { id: 2, nome: 'Terapeuta Teste' } },
        funcao: { id: 1, nome: 'Função' },
        localidade: null,
        statusEventos: { id: 1, nome: 'Pago' },
        frequencia: { id: 1, nome: 'Único' },
        intervalo: { id: 1, nome: 'Semanal' },
      },
    ];

    await expect(
      service.formatEvents(eventos as any, 'login'),
    ).resolves.toEqual(expect.any(Array));
  });
});
