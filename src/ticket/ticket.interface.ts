export interface TicketProps {
  id?: number;
  ticket: string;
  titulo: string;
  tipo: string;
  prioridade: string;
  atendente: string;
  fila: string;
  detalhe: string;
  data: string;

  userId: number;
}

export abstract class TicketServiceInterface {
  abstract create(body: TicketProps);
  abstract get(userId: number);
  abstract search(word: string, userId: number);
}
