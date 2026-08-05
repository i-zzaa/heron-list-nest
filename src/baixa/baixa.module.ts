import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { BaixaService } from './baixa.service';
import { BaixaController } from './baixa.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [BaixaService, PrismaService],
  exports: [BaixaService],
  controllers: [BaixaController],
})
export class BaixaModule {}
