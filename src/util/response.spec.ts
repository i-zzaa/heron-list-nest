import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { responseError } from './response';

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('responseError', () => {
  it('usa o status real de uma HttpException (401)', () => {
    const res = buildRes();
    responseError(res, new UnauthorizedException('Token inválido'));

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
  });

  it('usa o status real de uma HttpException (403)', () => {
    const res = buildRes();
    responseError(res, new ForbiddenException('Sem permissão'));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Sem permissão' });
  });

  it('usa o status real de uma HttpException (404)', () => {
    const res = buildRes();
    responseError(res, new NotFoundException('Paciente não encontrado'));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Paciente não encontrado',
    });
  });

  it('usa o status real de uma HttpException (400)', () => {
    const res = buildRes();
    responseError(res, new BadRequestException('Campo obrigatório'));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Campo obrigatório' });
  });

  it('mapeia erro de registro não encontrado do Prisma (P2025) para 404', () => {
    const res = buildRes();
    const error = new Prisma.PrismaClientKnownRequestError('not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    responseError(res, error);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('mapeia unique constraint do Prisma (P2002) para 409', () => {
    const res = buildRes();
    const error = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: 'test',
    });

    responseError(res, error);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('mapeia foreign key constraint do Prisma (P2003) para 409 com mensagem amigável', () => {
    const res = buildRes();
    const error = new Prisma.PrismaClientKnownRequestError('fk', {
      code: 'P2003',
      clientVersion: 'test',
    });

    responseError(res, error);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('vinculados'),
      }),
    );
  });

  it('trata Error genérico (regra de negócio) como 400 com a mensagem real', () => {
    const res = buildRes();
    responseError(res, new Error('Conflito de horário: terapeuta ocupada'));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Conflito de horário: terapeuta ocupada',
    });
  });

  it('trata string como mensagem customizada com 400', () => {
    const res = buildRes();
    responseError(res, 'Não foi possível atualizar o usuário!');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Não foi possível atualizar o usuário!',
    });
  });

  it('cai em 500 genérico quando não há erro nenhum (sem vazar detalhe interno)', () => {
    const res = buildRes();
    responseError(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Erro interno do servidor.',
    });
  });

  it('nunca inclui stack trace no corpo da resposta', () => {
    const res = buildRes();
    const error = new Error('falha interna sensível');
    responseError(res, error);

    const [body] = res.json.mock.calls[0];
    expect(JSON.stringify(body)).not.toContain('at ');
    expect(body).not.toHaveProperty('stack');
  });
});
