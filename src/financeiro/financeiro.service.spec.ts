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

  describe('snapshot financeiro (R17)', () => {
    it('paciente(): usa valorSessaoSnapshot em vez do valor atual do cadastro, quando presente', async () => {
      agendaService.getFilterFinancialPaciente.mockResolvedValueOnce([
        {
          dataInicio: '2026-07-01',
          diasFrequencia: '3',
          intervalo: { id: 1 },
          // Cadastro HOJE diz 999 — mas o evento foi congelado em 100.
          valorSessaoSnapshot: '100.00',
          paciente: {
            nome: 'Paciente Teste',
            vaga: { especialidades: [{ especialidadeId: 1, valor: '999.00' }] },
          },
          especialidade: { id: 1, nome: 'Fisioterapia' },
          statusEventos: { id: 1, nome: 'Pago', cobrar: true },
          terapeuta: { usuario: { nome: 'Terapeuta Teste' } },
          funcao: { id: 1, nome: 'Função' },
          modalidade: { nome: 'Individual' },
          km: '0',
        },
      ]);

      const result: any = await service.paciente({
        pacienteId: 10,
        dataInicio: '2026-07-01',
        datatFim: '2026-07-01',
      } as any);

      expect(result.geral.valorTotal).toBe(100);
    });

    it('terapeuta(): usa comissaoSnapshot/tipoComissaoSnapshot/valorSessaoSnapshot em vez do cadastro atual', async () => {
      agendaService.getFilterFinancialTerapeuta.mockResolvedValueOnce([
        {
          dataInicio: '2026-07-01',
          diasFrequencia: '3',
          intervalo: { id: 1 },
          valorSessaoSnapshot: '200.00',
          comissaoSnapshot: '50.00',
          tipoComissaoSnapshot: 'Fixo',
          paciente: {
            nome: 'Paciente Teste',
            vaga: { especialidades: [{ especialidadeId: 1, valor: '999.00' }] },
          },
          especialidade: { id: 1, nome: 'Fisioterapia' },
          terapeuta: {
            usuario: { nome: 'Terapeuta Teste' },
            // Comissão atual do cadastro (90/Percentual) é BEM diferente do
            // snapshot — se o teste passar com 50, é o snapshot que venceu.
            funcoes: [{ funcaoId: 1, comissao: '90.00', tipo: 'Percentual' }],
          },
          funcao: { id: 1, nome: 'Função' },
          statusEventos: { id: 1, nome: 'Pago', cobrar: true },
          modalidade: { nome: 'Individual' },
          km: '0',
        },
      ]);

      const result: any = await service.terapeuta({
        terapeutaId: 25,
        dataInicio: '2026-07-01',
        datatFim: '2026-07-01',
      } as any);

      // Fixo: valorSessao = comissaoValor (50), não sessaoValor*percentual.
      expect(result.geral.valorTotal).toBe(50);
    });

    it('terapeuta(): usa valorPorKmSnapshot e valorSessaoDevolutivaSnapshot quando presentes', async () => {
      agendaService.getFilterFinancialTerapeuta.mockResolvedValueOnce([
        {
          dataInicio: '2026-07-01',
          diasFrequencia: '3',
          intervalo: { id: 1 },
          valorSessaoSnapshot: '100.00',
          comissaoSnapshot: '100.00',
          tipoComissaoSnapshot: 'Fixo',
          valorPorKmSnapshot: '2.00', // bem diferente do default (0.9)
          paciente: {
            nome: 'Paciente Teste',
            vaga: { especialidades: [{ especialidadeId: 1, valor: '100.00' }] },
          },
          especialidade: { id: 1, nome: 'Fisioterapia' },
          terapeuta: {
            usuario: { nome: 'Terapeuta Teste' },
            funcoes: [{ funcaoId: 1, comissao: '100.00', tipo: 'Fixo' }],
          },
          funcao: { id: 1, nome: 'Função' },
          statusEventos: { id: 1, nome: 'Pago', cobrar: true },
          modalidade: { nome: 'Individual' },
          km: '10',
        },
      ]);

      const result: any = await service.terapeuta({
        terapeutaId: 25,
        dataInicio: '2026-07-01',
        datatFim: '2026-07-01',
      } as any);

      // valorTotal = comissao fixa (100) + km (10 * 2.00 = 20) = 120
      expect(result.geral.valorTotal).toBe(120);
    });
  });
});
