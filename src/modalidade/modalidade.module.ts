import { Module } from '@nestjs/common';

import { ModalidadeService } from './modalidade.service';
import { ModalidadeController } from './modalidade.controller';

@Module({
  providers: [ModalidadeService],
  exports: [ModalidadeService],
  controllers: [ModalidadeController],
})
export class ModalidadeModule {}
