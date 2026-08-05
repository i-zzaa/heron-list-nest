import { Module } from '@nestjs/common';

import { FuncaoService } from './funcao.service';
import { FuncaoController } from './funcao.controller';

@Module({
  providers: [FuncaoService],
  exports: [FuncaoService],
  controllers: [FuncaoController],
})
export class FuncaoModule {}
