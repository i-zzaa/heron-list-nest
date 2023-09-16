import { Controller, Get, Response, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { responseSuccess, responseError } from './util/response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getVersion(@Response() response: any): any {
    response.status(200).json({
      data: this.appService.getVersion(),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('intervalo/dropdown')
  async intervaloDropdown(@Response() response: any) {
    try {
      console.log('aqui');
      const data = await this.appService.intervaloDropdown();
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
