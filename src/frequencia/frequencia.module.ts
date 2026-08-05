import { Module } from '@nestjs/common';

import { FrequenciaService } from './frequencia.service';
import { FrequenciaController } from './frequencia.controller';

@Module({
  providers: [FrequenciaService],
  exports: [FrequenciaService],
  controllers: [FrequenciaController],
})
export class FrequenciaModule {}
