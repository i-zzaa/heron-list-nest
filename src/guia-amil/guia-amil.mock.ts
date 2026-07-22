export const guiaAmilMockResponse = {
  dropdown: [
    {
      id: 1,
      numeroGuia: 'GUIA-MOCK-001',
      tipoGuia: 'CONSULTA',
      status: 'RASCUNHO',
      paciente: { id: 1, nome: 'Paciente Mock' },
    },
    {
      id: 2,
      numeroGuia: 'GUIA-MOCK-002',
      tipoGuia: 'CONSULTA',
      status: 'PRONTA_PARA_ENVIO',
      paciente: { id: 2, nome: 'Paciente Mock 2' },
    },
  ],
  list: {
    data: [
      {
        id: 1,
        numeroGuia: 'GUIA-MOCK-001',
        tipoGuia: 'CONSULTA',
        status: 'RASCUNHO',
        valorTotal: 150,
        paciente: { id: 1, nome: 'Paciente Mock' },
        sessao: { id: 10 },
        criadoEm: '2026-07-21T00:00:00.000Z',
      },
      {
        id: 2,
        numeroGuia: 'GUIA-MOCK-002',
        tipoGuia: 'CONSULTA',
        status: 'PRONTA_PARA_ENVIO',
        valorTotal: 280,
        paciente: { id: 2, nome: 'Paciente Mock 2' },
        sessao: { id: 11 },
        criadoEm: '2026-07-21T00:10:00.000Z',
      },
    ],
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
    },
  },
  create: {
    id: 3,
    numeroGuia: 'GUIA-MOCK-003',
    tipoGuia: 'CONSULTA',
    status: 'RASCUNHO',
    valorTotal: 0,
    paciente: { id: 3, nome: 'Paciente Mock 3' },
    sessao: { id: 12 },
    criadoEm: '2026-07-21T00:20:00.000Z',
  },
  envio: {
    sucesso: true,
    guiaId: 1,
    loteId: 10,
    mensagem: 'Mock de envio realizado com sucesso',
  },
  historico: [
    {
      id: 1,
      guiaId: 1,
      status: 'RASCUNHO',
      descricao: 'Guia criada no modo mock',
      criadoEm: '2026-07-21T00:00:00.000Z',
    },
  ],
  lote: {
    id: 10,
    origem: 'MANUAL',
    status: 'CRIADO',
    quantidadeGuias: 1,
  },
};
