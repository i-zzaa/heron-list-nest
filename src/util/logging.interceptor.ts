import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Monitoramento básico do sistema via log estruturado: cada requisição HTTP
 * gera uma linha de log com método, rota, usuário (quando autenticado),
 * status resolvido e tempo de resposta. Antes disso não havia nenhum
 * registro central de requisições — só `console.log` esparsos e
 * inconsistentes espalhados pelos services.
 *
 * Isso não substitui uma ferramenta de APM (Datadog/Sentry/etc.) — é o
 * mínimo para conseguir investigar um incidente a partir dos logs do
 * processo (ex.: `pm2 logs`, saída padrão do container).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, url } = request;
    const usuario = request.user?.username || '-';
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duracaoMs = Date.now() - inicio;
          const status = request.res?.statusCode ?? '-';
          this.logger.log(
            `${method} ${
              originalUrl || url
            } ${status} ${duracaoMs}ms usuario=${usuario}`,
          );
        },
        error: (error) => {
          const duracaoMs = Date.now() - inicio;
          // O status de erro real é logado pelo AllExceptionsFilter (que
          // roda depois disso na cadeia); aqui só registramos que a
          // requisição falhou e quanto tempo levou até falhar.
          this.logger.warn(
            `${method} ${
              originalUrl || url
            } ERRO ${duracaoMs}ms usuario=${usuario}: ${
              error?.message || error
            }`,
          );
        },
      }),
    );
  }
}
