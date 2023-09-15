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

export interface UserRequestProps {
  id: number;
  nome: string;
  login: string;
  senha: string;
  ativo: boolean;
  perfilId: number;

  permissoesId: number[];

  especialidadeId?: number;
  funcoesId?: any[];
  fazDevolutiva?: boolean;
  cargaHoraria?: any[];
}
