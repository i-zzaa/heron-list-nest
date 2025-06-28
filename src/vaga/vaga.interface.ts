export interface VagaEspecialidadeProps {
  vagaId: number;
  agendar: number[] | never[];
  desagendar: number[];
  statusPacienteCod: string;
  pacienteId: number;
}
export interface EspecialidadeProps {
  agendado: boolean;
  nome: string;
  especialidadeId: number;
  vagaId: number;
}
export interface VagaProps {
  id: number;
  dataContato: string;
  status: string;
  especialidades: EspecialidadeProps[];
  tipoSessaoId: number;
  periodoId: number;
  statusId: number;
  pacienteId: number;
  naFila: boolean;
  observacao: string;
}

export interface FilaProps {
  vagaId: number;
  dataAgendado: string;
}

export interface AgendarEspecialidadeProps {
  vagaId: number;
  especialidadeId?: number;
  especialidades?: number[];
  statusPacienteCod: string;
  pacienteId: number;
}
