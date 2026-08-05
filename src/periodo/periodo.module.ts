import { Module } from '@nestjs/common';

import { PeriodoService } from './periodo.service';
import { PeriodoController } from './periodo.controller';

@Module({
  providers: [PeriodoService],
  exports: [PeriodoService],
  controllers: [PeriodoController],
})
export class PeriodoModule {}
