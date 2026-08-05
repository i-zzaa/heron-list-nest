import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { resolveError } from './response';

/**
 * Rede de segurança para erros que acontecem FORA do try/catch de um
 * controller (guard rejeitando, pipe de validação, erro em middleware) —
 * sem isso, esses casos caíam no handler padrão do Express/Nest, que podia
 * vazar stack trace e não tinha o mesmo log estruturado dos erros tratados
 * em `responseError`. Usa a mesma `resolveError` para manter o status e a
 * mensagem consistentes entre os dois caminhos.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const { status, message } = resolveError(exception);

    if (status >= 500) {
      this.logger.error(
        `${request?.method} ${
          request?.originalUrl || request?.url
        } -> ${status}`,
        (exception as Error)?.stack,
      );
    } else {
      this.logger.warn(
        `${request?.method} ${
          request?.originalUrl || request?.url
        } -> ${status}: ${message}`,
      );
    }

    response.status(status).json({ message });
  }
}
