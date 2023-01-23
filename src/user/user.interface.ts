export interface User {
  id?: number;
  nome: string;
  login: string;
  perfil?: any;
  ativo?: boolean;
  permissoes?: any;
  terapeuta?: any;
}

export abstract class UserServiceInterface {
  abstract createUser(): string;
  abstract getTerapeuta(): string;
  abstract updateUser(): string;
  abstract updatePassword(): string;
  abstract updatePasswordLogin(): string;
  abstract searchUsers(): string;
  abstract getUsers(): Promise<any[]>;
}
