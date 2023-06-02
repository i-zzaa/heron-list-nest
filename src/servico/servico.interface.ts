export interface ServicoProps {
  id: number;
  title: string;
  descricao: string;
}

export abstract class ServicoServiceInterface {
  abstract get(catalogoId: number): Promise<ServicoProps[]>;
  abstract search(word: string, catalogoId: number): Promise<ServicoProps[]>;
}
