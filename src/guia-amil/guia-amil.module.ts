import { Module } from '@nestjs/common';
import { GuiaAmilController } from './guia-amil.controller';
import { LoteGuiaController } from './lote-guia.controller';
import { GuiaAmilService } from './guia-amil.service';
import { AmilClientService } from './amil-client.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [GuiaAmilController, LoteGuiaController],
  providers: [GuiaAmilService, AmilClientService, PrismaService],
  exports: [GuiaAmilService],
})
export class GuiaAmilModule {}
