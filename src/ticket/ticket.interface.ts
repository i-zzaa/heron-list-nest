export interface DetailProps {
  id?: number;
  ticketId?: number;

  title: string;
  attendant: string;
  queue: string;
  detalhe: string;
  date: string;
}

export interface TicketProps {
  id?: number;
  ticket: string;
  title: string;
  type: string;
  priority: string;
  attendant: string;
  queue: string;
  date: string;

  userId: number;

  detail: DetailProps[];
}

export interface TicketCreateProps {
  ticket: string;
  title: string;
  type: string;
  priority: string;
  attendant: string;
  queue: string;
  date: string;
  status: string;

  userId: number;
}

export abstract class TicketServiceInterface {
  abstract create(body: TicketCreateProps);
  abstract get(userId: number);
  abstract search(word: string, userId: number);
}
