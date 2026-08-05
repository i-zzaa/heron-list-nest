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
import { normalizePageSize } from 'src/util/pagination';
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
      const pageSize = normalizePageSize(Number(req.query.pageSize));
      const filterBody = Body && Object.keys(Body).length ? Body : {};

      const data = await this.baixaService.getAll(page, pageSize, filterBody);
      responseSuccess(response, data);
    } catch (error) {
      console.log(error);

      responseError(response);
    }
  }

  @Put()
  async put(
    @Body() body: BaixaFilterProps,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      // Quem deu baixa é sempre o usuário autenticado (JWT), nunca o
      // usuarioId que o cliente possa enviar no corpo da requisição.
      const data = await this.baixaService.update(body, req.user?.username);
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
