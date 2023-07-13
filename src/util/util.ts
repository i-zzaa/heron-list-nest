export function removeStringRepeted(array, propriedade) {
  const uniqueObjects = [];
  const uniqueStrings = new Set();

  for (let i = 0; i < array.length; i++) {
    const objeto = array[i];
    const string = objeto[propriedade];

    if (!uniqueStrings.has(string)) {
      uniqueStrings.add(string);
      uniqueObjects.push(objeto);
    }
  }

  return uniqueObjects;
}

export enum STATUS {
  new = 'New',
  closed_successful = 'closed successful',
  closed_unsuccessful = 'closed unsuccessful',
  open = 'open',
  removed = 'removed',
  pending_reminder = 'pending reminder',
  pending_auto_close_plus = 'pending auto close+',
  pending_auto_close_mero = 'pending auto close-',
  merged = 'merged',
  closed_with_workaround = 'closed with workaround',
  aberto = 'Aberto',
  em_andamento = 'Em andamento',
  encerrado_old = 'Encerrado-Old',
  encerrado = 'Encerrado',
  reaberto = 'Reaberto',
  pendente = 'Pendente',
  aguardando_aprovacao = 'Aguardando aprovação',
  aguardando_aprovacao_ccm = 'Aguardando aprovação CCM',
  em_planejamento = 'Em planejamento',
  em_revisao = 'Em revisão',
  novo = 'Novo',
  resolvido = 'Resolvido',
  aprovado = 'Aprovado',
  cancelado = 'Cancelado',
  reajustar = 'Reajustar',
  concluido = 'Concluído',
}

export function setIconStatus(item) {
  switch (item.ticket_state.name) {
    case STATUS.reaberto:
    case STATUS.pending_reminder:
    case STATUS.pending_auto_close_plus:
    case STATUS.pending_auto_close_mero:
    case STATUS.pendente:
    case STATUS.aguardando_aprovacao:
    case STATUS.aguardando_aprovacao_ccm:
    case STATUS.em_planejamento:
    case STATUS.em_revisao:
    case STATUS.reajustar:
      item.icon = 'PhArrowsClockwise';
      item.color = 'reaberto';
      break;
    case STATUS.encerrado:
    case STATUS.removed:
    case STATUS.closed_unsuccessful:
    case STATUS.merged:
    case STATUS.closed_with_workaround:
    case STATUS.encerrado_old:
    case STATUS.cancelado:
      item.icon = 'PhCheck';
      item.color = 'encerrado';
      break;
    case STATUS.closed_successful:
    case STATUS.resolvido:
    case STATUS.aprovado:
    case STATUS.concluido:
      item.icon = 'PhCheck';
      item.color = 'resolvido';
      break;
    case STATUS.novo:
    case STATUS.open:
    case STATUS.new:
    case STATUS.aberto:
    case STATUS.em_andamento:
      item.icon = 'PhTicket';
      item.color = 'novo';
      break;
    default:
      item.icon = 'PhTicket';
      item.color = 'encerrado';
      break;
  }

  return item;
}

export enum CATALOG {
  suporteITSM = 'Suporte ITSM',
  suporteVoip = 'Suporte Voip',
  analiseDeDados = 'Análise de Dados',
  consultoria = 'Consultoria',
  hospedagem = 'Hospedagem',
  infraestrutura = 'Infraestrutura',
  kevins = 'Kevins',
  mentoria = 'Mentoria',
  suporteSistemas = 'Suporte a Sistemas',
  suporteUsuariosTi = 'Suporte ao Usuário de TI',
  vendas = 'Vendas',
}

export function setIconCatalog(item) {
  switch (item.title) {
    case CATALOG.suporteITSM:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.suporteVoip:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.analiseDeDados:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.consultoria:
      item.icon = 'PhShareNetwork';
      break;
    case CATALOG.hospedagem:
      item.icon = 'PhShareNetwork';
      break;
    case CATALOG.infraestrutura:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.kevins:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.mentoria:
      item.icon = 'PhShareNetwork';
      break;
    case CATALOG.suporteSistemas:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.suporteUsuariosTi:
      item.icon = 'PhBrowsers';
      break;
    case CATALOG.vendas:
      item.icon = 'PhBrowsers';
      break;
    default:
      item.icon = 'PhBrowsers';
      break;
  }

  return item;
}
