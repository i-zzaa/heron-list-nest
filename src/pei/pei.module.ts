import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PeiService } from './pei.service';
import { PeiController } from './pei.controller';

@Module({
  providers: [PeiService, PrismaService],
  exports: [PeiService],
  controllers: [PeiController],
})
export class PeiModule {}
