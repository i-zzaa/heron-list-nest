import { Module } from '@nestjs/common';

import { EspecialidadeService } from './especialidade.service';
import { EspecialidadeController } from './especialidade.controller';

@Module({
  providers: [EspecialidadeService],
  exports: [EspecialidadeService],
  controllers: [EspecialidadeController],
})
export class EspecialidadeModule {}
