import { Controller, Get, Response } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getVersion(@Response() response: any): any {
    response.status(200).json({
      data: this.appService.getVersion(),
    });
  }
}
