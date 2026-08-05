import { Module } from '@nestjs/common';

import { ProgramaService } from './programa.service';
import { ProgramaController } from './programa.controller';

@Module({
  providers: [ProgramaService],
  exports: [ProgramaService],
  controllers: [ProgramaController],
})
export class ProgramaModule {}
