import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

import { OtrsModule } from 'src/otrs/otrs.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [OtrsModule],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
