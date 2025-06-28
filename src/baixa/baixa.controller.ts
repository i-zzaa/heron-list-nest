import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Response,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaixaService } from './baixa.service';
import { BaixaFilterProps, BaixaProps } from './baixa.interface';
import { responseError, responseSuccess } from 'src/util/response';

@UseGuards(AuthGuard('jwt'))
@Controller('baixa')
export class BaixaController {
  constructor(private baixaService: BaixaService) {}

  @Post('filtro')
  async getAll(
    @Request() req: any,
    @Body() Body: BaixaFilterProps,
    @Response() response: any,
  ) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const data = await this.baixaService.getAll(page, pageSize, Body);
      responseSuccess(response, data);
    } catch (error) {
      console.log(error);

      responseError(response);
    }
  }

  @Put()
  async put(@Body() body: BaixaFilterProps, @Response() response: any) {
    try {
      const data = await this.baixaService.update(body);
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Response() response: any) {
    console.log(id);

    try {
      const data = await this.baixaService.delete(Number(id));
      responseSuccess(response, data);
    } catch (error) {
      responseError(response);
    }
  }
}
