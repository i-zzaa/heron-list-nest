import { Module } from '@nestjs/common';

import { BaixaService } from './baixa.service';
import { BaixaController } from './baixa.controller';
import { UserModule } from 'src/user/user.module';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  imports: [UserModule],
  providers: [BaixaService, PermissionsGuard],
  exports: [BaixaService],
  controllers: [BaixaController],
})
export class BaixaModule {}
