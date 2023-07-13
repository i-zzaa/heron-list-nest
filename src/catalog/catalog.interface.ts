export interface CatalogProps {
  id?: number;
  general_catalog_class?: string;
  name?: string;
  valid_id?: string;
  comments?: string;
  create_time?: string;
  create_by?: number;
  change_time?: string;
  change_by?: number;
}

export abstract class CatalogServiceInterface {
  abstract get(): Promise<any[]>;
  abstract search(word: string): Promise<any[]>;
}
