export interface CalendarioProps {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface ObjProps {
  nome: string;
  id: number;
  usuarioId?: number;
}

export interface CalendarioCreateParam {
  dataInicio: string;
  dataFim: string;
  start: string;
  end: string;
  diasFrequencia: number[];
  especialidade: ObjProps;
  frequencia: any;
  funcao: ObjProps;
  localidade: ObjProps;
  modalidade: ObjProps;
  paciente: ObjProps;
  statusEventos: ObjProps;
  intervalo: ObjProps;
  terapeuta: any;
  observacao: string;
  groupId: string;
  isExterno: boolean;
  km?: string;
}
