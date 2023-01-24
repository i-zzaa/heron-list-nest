export interface PerfilProps {
  id: number;
  nome: string;
}
export abstract class PerfilServiceInterface {
  abstract createPerfil(body: PerfilProps): Promise<PerfilProps>;
  abstract updatePerfil(body: PerfilProps, id: number): Promise<PerfilProps>;
  abstract getPerfil(): Promise<PerfilProps[]>;
  abstract searchPerfil(word: string): Promise<PerfilProps[]>;
}
