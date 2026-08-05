import { Module } from '@nestjs/common';

import { PeiService } from './pei.service';
import { PeiController } from './pei.controller';

@Module({
  providers: [PeiService],
  exports: [PeiService],
  controllers: [PeiController],
})
export class PeiModule {}
