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
  encerrado = 'Encerrado',
  reaberto = 'Reaberto',
  novo = 'Novo',
  resolvido = 'Resolvido',
}

// new
// closed successful
// closed unsuccessful
// open
// removed
// pending reminder
// pending auto close+
// pending auto close-
// merged
// closed with workaround
// Aberto
// Em andamento
// Encerrado-Old
// Novo
// Pendente
// Resolvido
// Aguardando aprovação
// Em planejamento
// Em revisão
// Aguardando aprovação CCM
// Aprovado
// Cancelado
// Reajustar
// Concluído
// Encerrado

export function setIconStatus(item) {
  switch (item.ticket_state.name) {
    case STATUS.reaberto:
      item.icon = 'PhArrowsClockwise';
      item.color = 'reaberto';
      break;
    case STATUS.encerrado:
      item.icon = 'PhCheck';
      item.color = 'encerrado';
      break;
    case STATUS.resolvido:
      item.icon = 'PhCheck';
      item.color = 'resolvido';
      break;
    case STATUS.novo:
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
