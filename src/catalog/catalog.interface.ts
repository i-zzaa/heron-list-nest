export interface CatalogProps {
  id?: number;
  title: string;
  description: string;
  icon: string;
}

export abstract class CatalogServiceInterface {
  abstract get(): Promise<CatalogProps[]>;
  abstract search(word: string): Promise<CatalogProps[]>;
}
