import { Module } from '@nestjs/common';

import { ProtocoloService } from './protocolo.service';
import { ProtocoloController } from './protocolo.controller';

@Module({
  providers: [ProtocoloService],
  exports: [ProtocoloService],
  controllers: [ProtocoloController],
})
export class ProtocoloeModule {}
