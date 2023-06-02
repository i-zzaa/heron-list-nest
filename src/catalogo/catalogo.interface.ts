export interface CatalogoProps {
  id?: number;
  title: string;
  descricao: string;
  icone: string;
}

export abstract class CatalogoServiceInterface {
  abstract get(): Promise<CatalogoProps[]>;
  abstract search(word: string): Promise<CatalogoProps[]>;
}
