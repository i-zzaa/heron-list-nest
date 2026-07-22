import { FinanceiroService } from './financeiro.service';
import { AgendaService } from '../agenda/agenda.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinanceiroService', () => {
  let service: FinanceiroService;
  let agendaService: {
    getFilterFinancialTerapeuta: jest.Mock;
    getFilterFinancialPaciente: jest.Mock;
  };

  beforeEach(() => {
    agendaService = {
      getFilterFinancialTerapeuta: jest.fn().mockResolvedValue([]),
      getFilterFinancialPaciente: jest.fn().mockResolvedValue([]),
    };

    service = new FinanceiroService(
      {} as PrismaService,
      agendaService as unknown as AgendaService,
    );
  });

  it('should map the incoming datatFim payload to the agenda filter', async () => {
    await service.terapeuta({
      terapeutaId: 25,
      datatFim: '2026-07-31',
      dataInicio: '2026-07-01',
    } as any);

    expect(agendaService.getFilterFinancialTerapeuta).toHaveBeenCalledWith(
      expect.objectContaining({
        terapeutaId: 25,
        dataFim: '2026-07-31',
        dataInicio: '2026-07-01',
      }),
    );
  });

  it('should not throw when an event is missing status metadata in paciente flow', async () => {
    agendaService.getFilterFinancialPaciente.mockResolvedValueOnce([
      {
        dataInicio: '2026-07-01',
        diasFrequencia: '3',
        intervalo: { id: 1 },
        paciente: {
          nome: 'Paciente Teste',
          vaga: {
            especialidades: [{ especialidadeId: 1, valor: '100' }],
          },
        },
        especialidade: { id: 1, nome: 'Fisioterapia' },
        terapeuta: {
          usuario: { nome: 'Terapeuta Teste' },
        },
        funcao: { id: 1, nome: 'Função' },
        modalidade: { nome: 'Individual' },
        km: '0',
      },
    ]);

    await expect(
      service.paciente({
        pacienteId: 10,
        dataInicio: '2026-07-01',
        datatFim: '2026-07-01',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        data: expect.any(Object),
        geral: expect.any(Object),
      }),
    );
  });

  it('should not throw when an event is missing start/end values', async () => {
    agendaService.getFilterFinancialTerapeuta.mockResolvedValueOnce([
      {
        dataInicio: '2026-07-01',
        diasFrequencia: '3',
        intervalo: { id: 1 },
        paciente: {
          nome: 'Paciente Teste',
          vaga: {
            especialidades: [{ especialidadeId: 1, valor: '100' }],
          },
        },
        especialidade: { id: 1, nome: 'Fisioterapia' },
        terapeuta: {
          usuario: { nome: 'Terapeuta Teste' },
          funcoes: [{ funcaoId: 1, comissao: '10', tipo: 'fixo' }],
        },
        funcao: { id: 1, nome: 'Função' },
        statusEventos: { id: 1, nome: 'Pago', cobrar: true },
        modalidade: { nome: 'Individual' },
        km: '0',
      },
    ]);

    await expect(
      service.terapeuta({
        terapeutaId: 25,
        dataInicio: '2026-07-01',
        datatFim: '2026-07-01',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        data: expect.any(Object),
        geral: expect.any(Object),
      }),
    );
  });
});
