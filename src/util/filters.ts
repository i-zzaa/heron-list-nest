export const getModalidadeIdsByStatusPaciente = (
  statusPacienteCod?: string,
) => {
  const mapping: Record<string, number[]> = {
    queue_avaliation: [1],
    queue_devolutiva: [2],
    queue_therapy: [3],
    devolutiva: [3],
  };

  return mapping[statusPacienteCod || ''] || [1, 2, 3];
};

export const buildDateRangeWhere = (dataInicio: string, dataFim: string) => ({
  dataInicio: {
    lte: dataFim,
  },
  OR: [
    {
      dataFim: '',
    },
    {
      dataFim: {
        gte: dataInicio,
      },
    },
  ],
});

export const buildPacienteFilter = (
  pacienteId: number | string | undefined,
  extraWhere: Record<string, any> = {},
) => {
  if (pacienteId === undefined || pacienteId === null || pacienteId === '') {
    return extraWhere;
  }

  return {
    pacienteId: Number(pacienteId),
    ...extraWhere,
  };
};

const ALLOWED_QUERY_FIELDS = new Set([
  'baixa',
  'convenioId',
  'pacienteId',
  'terapeutaId',
  'localidadeId',
  'statusEventosId',
  'usuarioId',
  'ticketId',
  // Filtro de Baixa por período (front: FINANCEIRO_FILTRO_SELECT_DATA_
  // INICIAL/FINAL, mesmos campos usados na tela de Baixa) — faltava
  // suporte aqui, então POST /baixa/filtro com dataInicio/dataFim no
  // corpo era silenciosamente ignorado (chave fora da allowlist).
  'dataInicio',
  'dataFim',
]);

export const buildQueryFilter = (
  query: Record<string, any> = {},
  extraWhere: Record<string, any> = {},
) => {
  const filter: Record<string, any> = { ...extraWhere };

  // Quando os dois vêm preenchidos, dataFim não pode ficar antes de
  // dataInicio — sem essa checagem o gte/lte resultante nunca bate com
  // nada (intervalo invertido) e o filtro simplesmente devolve lista
  // vazia, sem nenhum aviso de que o período em si é que está errado.
  if (query?.dataInicio && query?.dataFim && query.dataFim < query.dataInicio) {
    throw new Error('Data final não pode ser menor que a data inicial.');
  }

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === '_' || key.startsWith('_')) {
      return;
    }

    if (!ALLOWED_QUERY_FIELDS.has(key)) {
      return;
    }

    switch (key) {
      case 'baixa':
        filter[key] =
          value === true || value === 'true' || value === 1 || value === '1';
        break;
      case 'convenioId':
        filter.paciente = {
          ...(filter.paciente || {}),
          convenio: {
            ...(filter.paciente?.convenio || {}),
            id: Number(value),
          },
        };
        break;
      case 'pacienteId':
      case 'terapeutaId':
      case 'localidadeId':
      case 'statusEventosId':
      case 'usuarioId':
      case 'ticketId':
        filter[key] = Number(value);
        break;
      // Baixa.dataEvento é string única ('YYYY-MM-DD', comparação
      // lexicográfica funciona), não um par dataInicio/dataFim de série
      // recorrente como em Calendario — dataInicio/dataFim do filtro viram
      // limites (gte/lte) sobre essa mesma coluna.
      case 'dataInicio':
        filter.dataEvento = { ...(filter.dataEvento || {}), gte: value };
        break;
      case 'dataFim':
        filter.dataEvento = { ...(filter.dataEvento || {}), lte: value };
        break;
      default:
        filter[key] =
          typeof value === 'string' && /^-?\d+$/.test(value)
            ? Number(value)
            : value;
        break;
    }
  });

  return filter;
};
