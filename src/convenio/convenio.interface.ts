export interface ConvenioProps {
  id?: number;
  nome: string;
}

export abstract class ConvenioServiceInterface {
  abstract createConvenio(body: ConvenioProps): Promise<ConvenioProps>;
  abstract updateConvenio(
    body: ConvenioProps,
    id: number,
  ): Promise<ConvenioProps>;
  abstract getConvenio(): Promise<ConvenioProps[]>;
  abstract searchConvenio(word: string): Promise<ConvenioProps[]>;
}
