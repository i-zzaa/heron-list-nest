export interface PatientProps {
  id: number;
  nome: string;
  carteirinha: string;
  telefone: string;
  responsavel: string;
  dataNascimento: string;
  convenioId: number;
  statusId: number;
  statusPacienteCod: string;
}
interface Sessao {
  valor: string;
  especialidadeId: number;
  vagaId: number;
}
interface PatientQueueAvaliationPropsProps extends PatientProps {
  dataContato?: string;
  dataVoltouAba?: string;
  periodoId: number;
  pacienteId: number;
  tipoSessaoId?: number;
  especialidades: any;
  statusId: number;
  observacao: string;
  naFila: boolean;
  sessao: any;
}
