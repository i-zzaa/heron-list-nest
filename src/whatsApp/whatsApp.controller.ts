import {
  Controller,
  UseGuards,
  Get,
  Request,
  Body,
  Delete,
  Param,
  Post,
  Put,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WhatsappService } from './whatsApp.service';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get()
  async dropdown(@Response() response: any) {
    return await this.whatsappService.executeAlert();
    // try {
    //   const data = await this.whatsappService.executeAlert();
    //   responseSuccess(response, data);
    // } catch (error) {

    //   responseError(response);
    // }
  }
}
