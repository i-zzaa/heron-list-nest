import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProtocoloService } from './protocolo.service';
import { ProtocoloController } from './protocolo.controller';

@Module({
  providers: [ProtocoloService, PrismaService],
  exports: [ProtocoloService],
  controllers: [ProtocoloController],
})
export class ProtocoloeModule {}
