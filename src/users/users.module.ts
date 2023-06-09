import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

import { SoapModule } from 'nestjs-soap';

@Module({
  // imports: [
  //   SoapModule.register({
  //     clientName: process.env.SOAP_CLIENT_NAME,
  //     uri: process.env.SOAP_URI,
  //   }),
  // ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
