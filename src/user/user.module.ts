import { Module } from '@nestjs/common';
import { UserService } from './user.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from './user.controller';

@Module({
  providers: [UserService, PrismaService],
  exports: [UserService],
  controllers: [UserController],
  imports: [],
})
export class UserModule {}
