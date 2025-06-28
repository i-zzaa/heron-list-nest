export interface StatusEventosProps {
  id: number;
  nome: string;
  ativo: boolean;
  cobrar: boolean;
}

export enum STATUS_EVENTOS_ID {
  avisar = 1,
}
