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
      secret: process.env.JWT_PRIVATE_KEY,
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
  return await new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
        return;
      }
      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(port));
    });

    server.listen(port);
  });
}
if (require.main === module) {
  bootstrap();
}
