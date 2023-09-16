export interface PatientProps {
  id?: number;
  nome: string;
  carteirinha: string;
  telefone: string;
  responsavel: string;
  dataNascimento: string;
  convenioId: number;
  statusPacienteCod: string;
}

interface Sessao {
  especialidade: string;
  valor: string;
  especialidadeId: number;
  km: string;
}

export interface PatientCreate extends PatientProps {
  dataContato?: string;
  dataVoltouAba?: string;
  periodoId: number;
  pacienteId: number;
  tipoSessaoId?: number;
  especialidades: number[];
  statusId: number;
  observacao: string;
  naFila: boolean;
  sessao: Sessao[];
}
