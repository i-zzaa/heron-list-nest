import { ObjProps } from 'src/utils/interface.util';

export interface FilterFinancialTerapeutaProps {
  dataInicio: string;
  dataFim: string;
  id: number;
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
  groupId: number;
}

export abstract class EventoServiceInterface {
  abstract updateEvento(body: any, login: string): Promise<any>;
  abstract getMonth(params: any): Promise<any[]>;
  abstract formatEvents(eventos: any): any;
  abstract createEvento(
    body: CalendarioCreateParam,
    login: string,
  ): Promise<any>;
  abstract getFilter(params: any, query: any): Promise<any[]>;
  abstract getFilterFinancialPaciente({
    dataInicio,
    dataFim,
    id,
  }: FilterFinancialTerapeutaProps): Promise<any[]>;
  abstract getFilterFinancialTerapeuta({
    dataInicio,
    dataFim,
    id,
  }: FilterFinancialTerapeutaProps): Promise<any[]>;
}
