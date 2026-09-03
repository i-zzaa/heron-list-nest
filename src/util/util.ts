export enum DEVICE {
  mobile = 'DEVICE_MOBILE',
  web = 'DEVICE_WEB',
}

// Lista fechada dos perfis existentes no banco real (conferido via
// `SELECT id, nome FROM Perfil`: só existem essas 5 linhas hoje —
// Developer (bypass técnico) + os 4 papéis de negócio do enunciado). Não é
// um enum de banco (mudar o tipo da coluna Perfil.nome exigiria migration
// de dado arriscada); serve para checagens de código que antes usavam só
// `PERFIL.dev` e strings soltas (ex.: `validatePerfilId` continua validando
// contra a tabela, não contra este enum — isto aqui é para comparações
// pontuais, tipo "só Developer pode promover outro usuário a Developer").
export enum PERFIL {
  dev = 'Developer',
  admin = 'Administrador',
  coordenadora = 'Coordenadora',
  secretaria = 'Secretária',
  terapeuta = 'Terapeuta',
}

export type DeviceProps = 'DEVICE_MOBILE' | 'DEVICE_WEB';

export const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export enum TYPE_DTT {
  c = 'C',
  dt = 'DT',
  dv = 'DV',
  dg = 'DG',
  dp = 'DP',
}

export const calcAcertos = (array: string[]) => {
  const filteredArray = (array || []).filter((item) => item !== null);

  // Sem nenhuma resposta registrada (array vazio, ou só nulls filtrados),
  // countC/filteredArray.length é 0/0 = NaN — "NaN" ia parar direto na
  // tela (ex.: relatório de atividade por dia). "-" deixa claro que não
  // há dado, em vez de vazar o resultado bruto de uma divisão inválida.
  if (!filteredArray.length) {
    return '-';
  }

  const countC = filteredArray.filter((item) => item === TYPE_DTT.c).length;
  return ((countC / filteredArray.length) * 100).toFixed(2);
};

export enum TIPO_PORTAGE {
  socializacao = 'Socialização',
  cognicao = 'Cognição',
}

export enum VALOR_PORTAGE {
  sim = "1",
  asVezes = '0.5',
  nao = '0',
}

export enum VBMAPP {
  um = 1,
  dois = 2,
  tres = 3,
}
