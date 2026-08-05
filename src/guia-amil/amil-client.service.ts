import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmilClientService {
  private readonly baseUrl = process.env.AMIL_LOTE_GUIAS_URL || '';
  private readonly statusUrl = process.env.AMIL_STATUS_PROTOCOLO_URL || '';
  private readonly timeout = Number(process.env.AMIL_TIMEOUT_MS || 30000);

  async enviarLote(xml: string, idempotencyKey: string) {
    if (!this.baseUrl) {
      return {
        sucesso: false,
        codigoErro: 'CONFIG_NOT_FOUND',
        mensagemErro: 'URL da Amil não configurada',
      };
    }

    try {
      const response = await axios.post(this.baseUrl, xml, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/xml',
          'X-Idempotency-Key': idempotencyKey,
          'X-Soap-Action': process.env.AMIL_SOAP_ACTION_LOTE || '',
        },
      });

      return {
        sucesso: true,
        statusHttp: response.status,
        xmlRetorno: response.data,
      };
    } catch (error: any) {
      return {
        sucesso: false,
        codigoErro: error?.code || 'HTTP_ERROR',
        mensagemErro: error?.message || 'Falha na comunicação com a Amil',
        statusHttp: error?.response?.status || 0,
        xmlRetorno: error?.response?.data || '',
      };
    }
  }

  async consultarProtocolo(protocolo: string) {
    if (!this.statusUrl) {
      return {
        sucesso: false,
        codigoErro: 'CONFIG_NOT_FOUND',
        mensagemErro: 'URL de status da Amil não configurada',
      };
    }

    try {
      const response = await axios.post(
        this.statusUrl,
        `<protocolo>${protocolo}</protocolo>`,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/xml',
            'X-Soap-Action': process.env.AMIL_SOAP_ACTION_STATUS || '',
          },
        },
      );

      return {
        sucesso: true,
        statusHttp: response.status,
        xmlRetorno: response.data,
      };
    } catch (error: any) {
      return {
        sucesso: false,
        codigoErro: error?.code || 'HTTP_ERROR',
        mensagemErro: error?.message || 'Falha na consulta do protocolo',
        statusHttp: error?.response?.status || 0,
        xmlRetorno: error?.response?.data || '',
      };
    }
  }
}
