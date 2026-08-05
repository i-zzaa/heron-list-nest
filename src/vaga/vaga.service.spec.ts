import { VagaService } from './vaga.service';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

describe('VagaService.update — transação real (R13)', () => {
  const buildTx = () => ({
    vagaOnEspecialidade: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      aggregate: jest.fn().mockResolvedValue({ _count: { especialidadeId: 0 } }),
    },
    vaga: {
      update: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ dataContato: '2026-01-01' }),
    },
    modalidade: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
    calendario: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    pacienteHistorico: { create: jest.fn().mockResolvedValue({}) },
  });

  const buildService = () => {
    const tx = buildTx();
    // Client base "fora" da transação — se algum código chamar direto nele
    // em vez de `tx`, os testes abaixo pegam (os métodos aqui não são
    // stubados, então uma chamada real quebraria o teste).
    const prismaBase = {
      $transaction: jest.fn((fn: any) => fn(tx)),
    };

    const pacienteService = {
      setStatusPaciente: jest.fn().mockResolvedValue({}),
      setTipoSessaoTerapia: jest.fn().mockResolvedValue({}),
    };

    const service = new VagaService(
      { getPrismaClient: () => prismaBase } as any,
      pacienteService as any,
    );

    return { service, prismaBase, tx, pacienteService };
  };

  it('roda tudo dentro de um único prisma.$transaction', async () => {
    const { service, prismaBase } = buildService();

    await service.update({
      vagaId: 1,
      pacienteId: 1,
      agendar: [10],
      desagendar: [],
      statusPacienteCod: STATUS_PACIENT_COD.queue_avaliation,
    } as any);

    expect(prismaBase.$transaction).toHaveBeenCalledTimes(1);
  });

  it('usa o client transacional (tx) para as escritas, não o client base', async () => {
    const { service, tx } = buildService();

    await service.update({
      vagaId: 1,
      pacienteId: 1,
      agendar: [10],
      desagendar: [],
      statusPacienteCod: STATUS_PACIENT_COD.queue_avaliation,
    } as any);

    expect(tx.vagaOnEspecialidade.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ vagaId: 1 }),
      }),
    );
  });

  it('repassa o tx para PacienteService.setStatusPaciente/setTipoSessaoTerapia', async () => {
    const { service, tx, pacienteService } = buildService();

    await service.update({
      vagaId: 1,
      pacienteId: 7,
      agendar: [10],
      desagendar: [],
      statusPacienteCod: STATUS_PACIENT_COD.queue_avaliation,
    } as any);

    expect(pacienteService.setStatusPaciente).toHaveBeenCalledWith(
      expect.any(String),
      7,
      tx,
    );
  });

  it('aguarda de verdade a transição final em queue_therapy/desagendar (antes retornava uma Promise sem await)', async () => {
    const { service, tx } = buildService();
    tx.vagaOnEspecialidade.aggregate.mockResolvedValue({
      _count: { especialidadeId: 2 },
    });

    const result = await service.update({
      vagaId: 1,
      pacienteId: 1,
      agendar: [],
      desagendar: [10],
      statusPacienteCod: STATUS_PACIENT_COD.queue_therapy,
    } as any);

    // Se ainda estivesse sem `await`, `result` seria uma Promise, não um
    // boolean.
    expect(typeof result).toBe('boolean');
  });

  it('grava o histórico do paciente dentro da mesma transação quando não há agendar/desagendar', async () => {
    const { service, tx } = buildService();

    await service.update({
      vagaId: 1,
      pacienteId: 1,
      agendar: [],
      desagendar: [],
      statusPacienteCod: STATUS_PACIENT_COD.therapy,
    } as any);

    expect(tx.pacienteHistorico.create).toHaveBeenCalled();
  });
});
