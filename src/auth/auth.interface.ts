import { UserProps } from 'src/user/user.interface';

export interface AuthProps {
  login: string;
  senha: string;
}

export interface AuthResponse {
  accessToken: Promise<string> | unknown;
  user: UserProps;
}

export abstract class AuthServiceInterface {
  abstract loginService(params: AuthProps): Promise<AuthResponse>;
}
