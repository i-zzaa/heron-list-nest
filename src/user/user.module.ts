import { Module } from '@nestjs/common';
import { UserService } from './user.service';

import { UserController } from './user.controller';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Module({
  providers: [UserService, PermissionsGuard],
  exports: [UserService],
  controllers: [UserController],
  imports: [],
})
export class UserModule {}
