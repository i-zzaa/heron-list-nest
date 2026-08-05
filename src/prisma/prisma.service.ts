import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Quantidade de conexões abertas em paralelo na subida do processo. O banco
// (hospedagem compartilhada) demora ~800ms pra estabelecer uma conexão nova
// (TLS + handshake do MySQL) mas só ~30ms por consulta numa conexão já
// aberta — medido diretamente contra o banco real. Sem isso, essa demora de
// ~800ms aparecia espalhada nas primeiras requisições reais depois de cada
// subida/reinício do processo (ex.: toda vez que o `nest start --watch`
// reinicia em desenvolvimento), em vez de acontecer uma vez só, no boot,
// em paralelo.
const POOL_WARMUP_CONNECTIONS = 8;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  async onModuleInit() {
    const start = Date.now();

    await Promise.all(
      Array.from({ length: POOL_WARMUP_CONNECTIONS }, () =>
        this.prisma.$queryRawUnsafe('SELECT 1'),
      ),
    );

    this.logger.log(
      `Pool de conexões com o banco aquecido (${POOL_WARMUP_CONNECTIONS} conexões, ${
        Date.now() - start
      }ms)`,
    );
  }

  async onModuleDestroy() {
    console.log('banco desconectado');

    await this.prisma.$disconnect();
  }

  // async enableShutdownHooks(app: INestApplication) {
  //   this.prisma.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }
}
