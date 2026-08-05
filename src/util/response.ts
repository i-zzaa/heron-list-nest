import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const responseSuccess = (response: any, data: any, message?: string) => {
  return message
    ? response.status(200).json({ data, message })
    : response.status(200).json(data);
};

/**
 * Antes disso, TODA falha (não autenticado, sem permissão, validação de
 * negócio, registro não encontrado, erro de banco, bug interno) voltava
 * como `401 { message: 'Erro na conexão!' }` — o cliente não tinha como
 * diferenciar nada, e a maioria dos controllers nem passava o `error`
 * capturado para essa função, então a mensagem real do erro era descartada.
 *
 * Agora: resolve o status HTTP e a mensagem a partir do tipo real do erro,
 * sem nunca vazar stack trace para o cliente (só loga no servidor).
 */
export const responseError = (response: any, error?: unknown) => {
  const { status, message } = resolveError(error);

  if (status >= 500) {
    // Erro inesperado: loga completo no servidor, nunca manda stack/detalhe
    // interno para o cliente.
    console.error(error);
  }

  return response.status(status).json({ message });
};

export const resolveError = (
  error: unknown,
): { status: number; message: string } => {
  if (error === undefined || error === null) {
    return { status: 500, message: 'Erro interno do servidor.' };
  }

  // Mensagem customizada passada diretamente (ex.: responseError(res, 'X')).
  if (typeof error === 'string') {
    return { status: 400, message: error };
  }

  // Exceções nativas do Nest (UnauthorizedException, ForbiddenException,
  // BadRequestException, NotFoundException, etc.) já carregam o status certo.
  if (error instanceof HttpException) {
    const body = error.getResponse();
    const message =
      typeof body === 'string' ? body : (body as any)?.message || error.message;

    return {
      status: error.getStatus(),
      message: Array.isArray(message) ? message.join(', ') : message,
    };
  }

  // Erros do Prisma: mapeia os códigos mais comuns para status HTTP
  // condizentes, com mensagem amigável em vez do erro cru do banco.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025': // registro não encontrado (update/delete/findFirstOrThrow)
        return { status: 404, message: 'Registro não encontrado.' };
      case 'P2002': // unique constraint
        return {
          status: 409,
          message: 'Já existe um registro com esse valor.',
        };
      case 'P2003': // foreign key constraint (ex.: exclusão de cadastro em uso)
        return {
          status: 409,
          message:
            'Não é possível concluir: existem registros vinculados a este item.',
        };
      default:
        return {
          status: 400,
          message: 'Não foi possível processar a solicitação.',
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      message: 'Dados inválidos enviados para o servidor.',
    };
  }

  // Erros de negócio lançados como `new Error('mensagem')` pelo próprio
  // código (padrão usado em várias validações, ex.: agenda.service.ts) —
  // tratados como 400, com a mensagem real (é o motivo de ter sido lançada).
  if (error instanceof Error) {
    return { status: 400, message: error.message || 'Requisição inválida.' };
  }

  return { status: 500, message: 'Erro interno do servidor.' };
};

export enum MESSAGE {
  cadastro_sucesso = 'Cadastrado com sucesso!',
  atualizacao_sucesso = 'Atualizado com sucesso!',
  desabilitado_sucesso = 'Desabilitado com sucesso!',
}
