import { Module } from '@nestjs/common';

import { TipoSessaoService } from './tipo-sessao.service';
import { TipoSessaoController } from './tipo-sessao.controller';

@Module({
  providers: [TipoSessaoService],
  exports: [TipoSessaoService],
  controllers: [TipoSessaoController],
})
export class TipoSessaoModule {}
