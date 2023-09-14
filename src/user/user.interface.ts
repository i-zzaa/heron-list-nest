export interface UserProps {
  id?: number;
  nome: string;
  login?: string;
  username?: string;
  senha?: string;
  perfil?: PerfilProps;
  ativo?: boolean;
  permissoes?: any;
}

export interface PerfilProps {
  id: number;
  nome: string;
}

export interface UserAuthProps {
  password: string;
  username: string;
}
