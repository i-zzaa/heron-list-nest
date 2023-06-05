export interface ServiceProps {
  id: number;
  title: string;
  description: string;
}

export abstract class ServiceServiceInterface {
  abstract get(catalogId: number): Promise<ServiceProps[]>;
  abstract search(word: string, catalogId: number): Promise<ServiceProps[]>;
}
