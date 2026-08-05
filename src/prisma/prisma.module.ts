import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// `PrismaService` estava listado no array `providers` de ~28 módulos
// diferentes, sem nenhum `PrismaModule` compartilhado — no NestJS, isso não
// reaproveita uma única instância: cada módulo que lista uma classe nos
// próprios `providers` ganha a SUA instância, com o SEU próprio
// `PrismaClient` e a SUA própria pool de conexões. Na prática, a aplicação
// rodava com dezenas de conexões/pools redundantes com o banco (achado ao
// investigar lentidão — o log de "pool aquecido" aparecia mais de uma vez
// na mesma subida). `@Global()` aqui faz o oposto: uma instância só,
// compartilhada por toda a aplicação, bastando importar este módulo uma
// vez (em `AppModule`) para injetar `PrismaService` em qualquer lugar.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
