export const responseSuccess = (response: any, data: any, message?: string) => {
  return message
    ? response.status(200).json({ data, message })
    : response.status(200).json(data);
};

export const responseError = (response: any, error?: any) => {
  return response.status(401).json({ message: error || 'Erro na conexão!' });
};

export enum MESSAGE {
  cadastro_sucesso = 'Cadastrado com sucesso!',
  atualizacao_sucesso = 'Atualizado com sucesso!',
  desabilitado_sucesso = 'Desabilitado com sucesso!',
}
