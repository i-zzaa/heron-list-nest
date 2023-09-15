import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';

@Module({
  providers: [StatusService, PrismaService],
  exports: [StatusService],
  controllers: [StatusController],
})
export class StatusModule {}
