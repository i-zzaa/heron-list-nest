export const ERROR_LOGIN_PASSWORD = 'Login e/ou senha inválido(a)!';
export const ERROR_NOT_FOUND_USER = 'Usuário não cadastrado!';
export const ERROR_NOT_ACTIVE = 'Usuário não está ativo!';

export const SUCCESS_CREATE = 'Criado com sucesso!';
export const SUCCESS_UPDATE = 'Atualizado com sucesso!';
export const DELETE_UPDATE = 'Excluido com sucesso!';

export const ERROR_CREATE = 'Erro na criação!';
export const ERROR_DELETE = 'Erro na exclusão!';
export const ERROR_UPDATE = 'Erro na atualização!';

export const messageErrorLogin = () => ({
  status: false,
  message: ERROR_LOGIN_PASSWORD,
});

export const messageSuccessLogin = (data: any) => ({
  message: 'Logado!',
  ...data,
});

export const messageSuccessList = (data: any) => data;

export const messageSuccess = (data: any) => ({
  message: SUCCESS_CREATE,
  ...data,
});

export const messageUpdate = (data: any) => ({
  message: SUCCESS_UPDATE,
  ...data,
});

export const messageDelete = (data: any) => ({
  message: SUCCESS_UPDATE,
  ...data,
});
