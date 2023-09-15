export const responseSuccess = (response: any, data: any) => {
  return response.status(200).json({ data });
};

export const responseError = (response: any) => {
  return response.status(401).json({ data: [], messsage: 'Erro na conexão!' });
};
