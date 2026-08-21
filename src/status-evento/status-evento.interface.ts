export interface StatusEventosProps {
  id: number;
  nome: string;
  // Código estável (ex.: "falta", "atendido") pra lógica do front — gerado
  // a partir do nome quando não informado (ver StatusEventoService.create).
  codigo?: string;
  cor?: string;
  ativo: boolean;
  cobrar: boolean;
  atender: boolean;
}

export enum STATUS_EVENTOS_ID {
  avisar = 1,
}
