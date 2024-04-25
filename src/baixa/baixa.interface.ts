export interface BaixaFilterProps {
  id?: number;
  pacienteId?: number;
  terapeutaId?: number;
  localidadeId?: number;
  convenioId?: number;
  statusEventosId?: number;
  usuarioId?: number;
  baixa: boolean;
}

export interface BaixaProps {
  paciente: string;
  terapeuta: string;
  localidade: string;
  convenio: string;
  statusEventos: string;
  usuario: string;
  baixa: boolean;
}

export interface BaixaCreateProps {
  pacienteId: number;
  terapeutaId: number;
  localidadeId: number;
  statusEventosId: number;
  eventoId: number;
  dataEvento: string;
}
