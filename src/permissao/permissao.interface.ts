export interface PermissaoProps {
  id?: number;
  cod: string;
  descricao: string;
}

export abstract class PermissaoServiceInterface {
  abstract createPermissao(body: PermissaoProps): Promise<PermissaoProps>;
  abstract updatePermissao(
    body: PermissaoProps,
    id: number,
  ): Promise<PermissaoProps>;
  abstract searchPermissao(word: string): Promise<PermissaoProps[]>;
  abstract getPermissaoUser(login: string): Promise<PermissaoProps[]>;
}
