export interface GuiaAmilCreateDto {
  numeroGuia?: string;
  tipoGuia: string;
  pacienteId: number;
  sessaoId?: number;
  prestadorId?: number;
  dadosGuia?: any;
  valorTotal?: number;
  status?: string;
}

export interface GuiaAmilUpdateDto {
  numeroGuia?: string;
  tipoGuia?: string;
  pacienteId?: number;
  sessaoId?: number;
  prestadorId?: number;
  dadosGuia?: any;
  valorTotal?: number;
  status?: string;
}

export interface GuiaAmilListQuery {
  page?: number;
  limit?: number;
  status?: string;
  paciente?: string;
  numeroGuia?: string;
  numeroLote?: string;
  protocolo?: string;
  dataInicio?: string;
  dataFim?: string;
}
