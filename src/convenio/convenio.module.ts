import { Module } from '@nestjs/common';

import { ConvenioService } from './convenio.service';
import { ConvenioController } from './convenio.controller';

@Module({
  providers: [ConvenioService],
  exports: [ConvenioService],
  controllers: [ConvenioController],
})
export class ConvenioModule {}
