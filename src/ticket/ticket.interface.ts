import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

export class TicketCreateProps {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  readonly type: string;

  @IsString()
  readonly priority: string;

  @IsString()
  readonly attendant: string;

  @IsString()
  readonly queue: string;

  @IsString()
  readonly date: string;

  @IsString()
  readonly status: string;

  @IsNumber()
  readonly userId: number;
}

export abstract class TicketServiceInterface {
  abstract create(body: TicketCreateProps);
  abstract get(userId: number);
  abstract search(word: string, userId: number);
}
