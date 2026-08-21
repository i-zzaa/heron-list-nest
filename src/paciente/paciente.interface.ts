export interface PatientProps {
  id?: number;
  nome: string;
  carteirinha: string;
  telefone: string;
  responsavel: string;
  dataNascimento: string;
  convenioId: number;
  statusPacienteCod: string;
  // Data de emissão dos documentos — vencimento é calculado (Plano: +6
  // meses, Laudo: +12 meses), ver PacienteService.
  dataEmissaoPlanoTerapeutico?: string | null;
  dataEmissaoLaudoMedico?: string | null;
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
