import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { FrequenciaService } from './frequencia.service';
import { FrequenciaController } from './frequencia.controller';

@Module({
  providers: [FrequenciaService, PrismaService],
  exports: [FrequenciaService],
  controllers: [FrequenciaController],
})
export class FrequenciaModule {}
