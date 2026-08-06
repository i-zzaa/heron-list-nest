import { Module } from '@nestjs/common';
import { HistoricoService } from './historico.service';
import { HistoricoController } from './historico.controller';

@Module({
  providers: [HistoricoService],
  controllers: [HistoricoController],
  exports: [HistoricoService],
})
export class HistoricoModule {}
