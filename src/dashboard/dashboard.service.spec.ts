import { DashboardService } from './dashboard.service';

const buildService = (documentosVencendo: any[]) => {
  const pacienteServiceMock: any = {
    getDocumentosVencendo: jest.fn().mockResolvedValue(documentosVencendo),
  };

  const service: any = new DashboardService(
    { getPrismaClient: () => ({}) } as any,
    pacienteServiceMock,
  );

  // As três fontes de pendência pré-existentes (agenda) não são o foco
  // aqui — mockadas vazias pra isolar só o comportamento do item novo
  // (Plano Terapêutico/Laudo Médico vencendo).
  jest.spyOn(service, 'getEventosDoDia').mockResolvedValue([]);
  jest.spyOn(service, 'getEventosNoIntervalo').mockResolvedValue([]);
  jest.spyOn(service, 'mapaStatusEventos').mockResolvedValue(new Map());

  return { service, pacienteServiceMock };
};

describe('DashboardService.getPendencias — documentos-vencendo (Plano Terapêutico/Laudo Médico)', () => {
  it('inclui a pendência "documentos-vencendo" quando há pacientes com documento vencido/vencendo', async () => {
    const { service, pacienteServiceMock } = buildService([
      { pacienteId: 1, pacienteNome: 'Fulano', tipo: 'plano_terapeutico' },
      { pacienteId: 2, pacienteNome: 'Ciclana', tipo: 'laudo_medico' },
    ]);

    const pendencias = await service.getPendencias('hoje');

    expect(pacienteServiceMock.getDocumentosVencendo).toHaveBeenCalledWith(15);
    const item = pendencias.find((p: any) => p.tipo === 'documentos-vencendo');
    expect(item).toMatchObject({ tipo: 'documentos-vencendo', quantidade: 2 });
  });

  it('não inclui a pendência quando não há nenhum documento vencido/vencendo', async () => {
    const { service } = buildService([]);

    const pendencias = await service.getPendencias('hoje');

    expect(
      pendencias.find((p: any) => p.tipo === 'documentos-vencendo'),
    ).toBeUndefined();
  });
});
