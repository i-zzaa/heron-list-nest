import { Module } from '@nestjs/common';
import { UserService } from './user.service';

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
