import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';

export function setupRuntimeCompat() {
  if (typeof File === 'undefined') {
    (global as any).File = class File {};
  }
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

  app.enableCors();

  app.use(
    session({
      secret: process.env.JWT_PRIVATE_KEY || 'dev-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: [
      'http://127.0.0.1:5173',
      'https://fbuots.hospedagemelastica.com.br/',
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
