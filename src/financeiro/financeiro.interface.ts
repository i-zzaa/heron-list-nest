export interface FinancialProps {
  terapeutaId: number;
  pacienteId: number;
  statusEventosId: number;
  datatFim: string;
  dataInicio: string;
}

export interface FinancialPacienteProps {
  paciente: string;
  terapeuta: string;
  status: string;
  sessao: number;
  km: number;
  valorSessao: number;
  valorTotal: number;
  data: string;
  funcao: string;
  horas: string;
  especialidade: string;
}

export interface FinancialTerapeutaProps {
  paciente: string;
  terapeuta: string;
  comissao: number;
  tipo: string;
  status: string;
  sessao: number;
  km: number;
  devolutiva: boolean;
  data: string;
  horas: string;
}

export class FinancialTerapeuta {
  paciente: string;
  terapeuta: string;
  comissao: number;
  tipo: string;
  status: string;
  data: string;
  horas: string;
  sessao: number;
  km: number;
  devolutiva: boolean;
  valorKm: number = 0;
  valorSessao: number = 0;
  valorTotal: number = 0;

  constructor({
    paciente,
    terapeuta,
    data,
    comissao,
    tipo,
    status,
    sessao,
    km,
    devolutiva,
    horas,
  }: FinancialTerapeutaProps) {
    this.paciente = paciente;
    this.terapeuta = terapeuta;
    this.comissao = comissao;
    this.tipo = tipo;
    this.sessao = sessao;
    this.km = km;
    this.devolutiva = devolutiva;
    this.status = status;
    this.data = data;
    this.horas = horas;
  }
}

export class FinancialPaciente {
  paciente: string;
  terapeuta: string;
  status: string;
  funcao: string;
  especialidade: string;
  data: string;
  horas: string;
  sessao: number;
  km: number;
  valorSessao: number = 0;
  valorTotal: number = 0;

  constructor({
    paciente,
    terapeuta,
    data,
    status,
    sessao,
    km,
    valorSessao,
    valorTotal,
    funcao,
    horas,
    especialidade,
  }: FinancialPacienteProps) {
    this.paciente = paciente;
    this.terapeuta = terapeuta;
    this.funcao = funcao;
    this.sessao = sessao;
    this.km = km;
    this.status = status;
    this.data = data;
    this.valorSessao = valorSessao;
    this.valorTotal = valorTotal;
    this.horas = horas;

    this.especialidade = especialidade;
  }
}
