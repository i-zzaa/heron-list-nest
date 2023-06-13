import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AutheticatedGuard } from './auth/autheticated.guard';

@Controller()
// @UseGuards(AuthGuard('jwt'))
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getVersion(): string {
    return this.appService.getVersion();
  }

  @Get('network')
  @UseGuards(AutheticatedGuard)
  getInterfaceNetwork() {
    return this.appService.getInterfaceNetwork();
  }
}
