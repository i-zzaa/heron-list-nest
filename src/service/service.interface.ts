export interface ServiceProps {
  id: number;
  cod?: string;
  name: string;
}

export interface ServiceResponse {
  id: number;
  cod?: string;
  title: string;
}

export abstract class ServiceServiceInterface {
  abstract getAll(): Promise<ServiceProps[]>;
  abstract get(cod: string): Promise<ServiceResponse[]>;
  abstract search(word: string, catalogCod: string): Promise<ServiceResponse[]>;
}
