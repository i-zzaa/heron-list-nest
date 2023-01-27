export interface FrequenciaProps {
  id: number;
  nome: string;
  ativo?: boolean;
}

export abstract class FrequenciaServiceInterface {
  abstract createFrequencia(): string;
  abstract updateFrequencia(): string;
  abstract getFrequencia(): string;
  abstract deleteFrequencia(): string;
  abstract searchFrequencia(): string;
  abstract getFrequenciaName(nome: string): Promise<FrequenciaProps>;
}
