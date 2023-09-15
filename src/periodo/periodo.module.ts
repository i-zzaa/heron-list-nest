import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { PeriodoService } from './periodo.service';
import { PeriodoController } from './periodo.controller';

@Module({
  providers: [PeriodoService, PrismaService],
  exports: [PeriodoService],
  controllers: [PeriodoController],
})
export class PeriodoModule {}
