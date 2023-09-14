import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

import * as cors from 'cors';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(
        cors({
          origin: '*',
        }),
      ) // Aplica o middleware cors
      .forRoutes('*'); // Habilita o CORS para todas as rotas
  }
}
