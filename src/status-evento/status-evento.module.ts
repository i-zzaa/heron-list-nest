import { Module } from '@nestjs/common';

import { StatusEventoService } from './status-evento.service';
import { StatusEventoController } from './status-evento.controller';

@Module({
  providers: [StatusEventoService],
  exports: [StatusEventoService],
  controllers: [StatusEventoController],
})
export class StatusEventoModule {}
