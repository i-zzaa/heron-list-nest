import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
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
