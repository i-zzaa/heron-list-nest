import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { TerapeutaService } from './terapeuta.service';
import { TerapeutaController } from './terapeuta.controller';

@Module({
  providers: [TerapeutaService, PrismaService],
  exports: [TerapeutaService],
  controllers: [TerapeutaController],
})
export class TerapeutaModule {}
