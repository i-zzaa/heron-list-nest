export interface UserProps {
  id?: number;
  nome: string;
  senha?: string;
  login: string;
  perfil?: any;
  ativo?: boolean;
  permissoes?: any;
  terapeuta?: any;
}

export interface ComissaoProps {
  funcaoId: number;
  comissao: string;
  tipo: string;
}

export interface CreateUserProps {
  nome: string;
  login: string;
  senha: string;
  ativo: boolean;
  perfilId: number;
  permissoesId: number[];
  devolutiva?: boolean;
  especialidadeId?: number;
  cargaHoraria?: any[];
  comissao?: ComissaoProps[];
}

export interface TerapeutaProps {
  id: number;
  nome: string;
  login: string;
  perfil: any;
  ativo: boolean;
  terapeuta: any;
}

export interface UserPasswordLoginProps {
  login: string;
  senha: string;
}

export abstract class UserServiceInterface {
  abstract createUser(body: any): Promise<UserProps>;
  abstract getTerapeuta(): Promise<TerapeutaProps[]>;
  abstract updateUser(body: any): void;
  abstract updatePassword(userId: number): void;
  abstract updatePasswordLogin(login: string, updatePassword: string): void;
  abstract searchUsers(word: string): Promise<UserProps[]>;
  abstract getUsers(): Promise<UserProps[]>;
  abstract getUser(login: string): Promise<UserProps>;
}
