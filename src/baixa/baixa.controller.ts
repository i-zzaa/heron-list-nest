import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  Response,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizePageSize } from 'src/util/pagination';
import { BaixaService } from './baixa.service';
import { BaixaFilterProps, BaixaProps } from './baixa.interface';
import { responseError, responseSuccess } from 'src/util/response';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermission } from 'src/auth/require-permission.decorator';

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

      responseError(response, error);
    }
  }

  @UseGuards(PermissionsGuard)
  @RequirePermission('AGENDA_BAIXA_UPDATE')
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
      responseError(response, error);
    }
  }

  // Motivo é obrigatório (BaixaService.delete rejeita se vier vazio) — aceito
  // tanto no corpo quanto na query string, porque clientes DELETE nem sempre
  // mandam body com facilidade.
  @UseGuards(PermissionsGuard)
  @RequirePermission('AGENDA_BAIXA_DELETE')
  @Delete(':id')
  async delete(
    @Param('id') id: number,
    @Body() body: { motivo?: string },
    @Query('motivo') motivoQuery: string,
    @Request() req: any,
    @Response() response: any,
  ) {
    try {
      const motivo = body?.motivo || motivoQuery;
      const data = await this.baixaService.delete(
        Number(id),
        motivo,
        req.user?.username,
      );
      responseSuccess(response, data);
    } catch (error) {
      responseError(response, error);
    }
  }
}
