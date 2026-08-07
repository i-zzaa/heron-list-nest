import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import { LoggingInterceptor } from './util/logging.interceptor';
import { AllExceptionsFilter } from './util/all-exceptions.filter';

export function setupRuntimeCompat() {
  if (typeof File === 'undefined') {
    (global as any).File = class File {};
  }
}

// Antes a sessão sempre reusava JWT_PRIVATE_KEY com fallback hardcoded
// 'dev-secret-key' — existe uma SESSION_PRIVATE_KEY dedicada no .env que
// nunca era lida. Falha explícita se nenhuma das duas estiver configurada,
// em vez de rodar com um segredo previsível.
export function resolveSessionSecret(): string {
  const sessionSecret =
    process.env.SESSION_PRIVATE_KEY || process.env.JWT_PRIVATE_KEY;

  if (!sessionSecret) {
    throw new Error(
      'SESSION_PRIVATE_KEY (ou JWT_PRIVATE_KEY) não configurado — obrigatório para a sessão.',
    );
  }

  return sessionSecret;
}

export function setupShutdownHooks(app: any) {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully`);

    try {
      if (typeof app?.close === 'function') {
        await app.close();
      }
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

setupRuntimeCompat();

const { AppModule } = require('./app.module');
// const { WhatsappService } = require('src/whatsApp/whatsApp.service');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Monitoramento básico via log estruturado: toda requisição (interceptor)
  // e todo erro que escape do try/catch de um controller (filter) ficam
  // registrados de forma consistente — ver util/logging.interceptor.ts e
  // util/all-exceptions.filter.ts.
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(
    session({
      secret: resolveSessionSecret(),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Única configuração de CORS da aplicação (antes havia 3 conflitantes:
  // um enableCors() aberto, este com lista restrita, e um middleware
  // cors({origin:'*'}) global em AppModule — removido). A origem de produção
  // tinha "/" no final, que nunca bate com o header Origin enviado pelo
  // navegador (sem barra) — CORS estava silenciosamente quebrado para ela.
  app.enableCors({
    origin: [
      'http://127.0.0.1:5173',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'https://fbuots.hospedagemelastica.com.br',
      'https://agenda-multialcance.com.br',
      'https://www.agenda-multialcance.com.br',
      'https://aba-multialcance.com.br',
      'https://www.aba-multialcance.com.br',
    ],
    credentials: true,
  });

  const requestedPort = Number(process.env.PORT || 3000);
  const port = await getAvailablePort(requestedPort);
  await app.listen(port);
  setupShutdownHooks(app);
  console.log(`Application listening on port ${port}`);
}

export async function getAvailablePort(port: number): Promise<number> {
  const net = require('node:net');
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidatePort = port + attempt;

    try {
      await new Promise<void>((resolve, reject) => {
        const server = net.createServer();

        server.once('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            reject(error);
            return;
          }
          reject(error);
        });

        server.once('listening', () => {
          server.close(() => resolve());
        });

        server.listen(candidatePort);
      });

      return candidatePort;
    } catch (error: any) {
      if (error?.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to find a free port after ${maxAttempts} attempts starting from ${port}`,
  );
}
if (require.main === module) {
  bootstrap();
}
