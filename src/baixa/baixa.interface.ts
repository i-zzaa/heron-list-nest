export interface BaixaFilterProps {
  id?: number;
  pacienteId?: number;
  terapeutaId?: number;
  localidadeId?: number;
  convenioId?: number;
  statusEventosId?: number;
  usuarioId?: number;
  // Também dobra de payload de PUT /baixa (BaixaController.put): quando vem
  // preenchida a própria chave (mesmo com valor null, pra limpar o vínculo),
  // BaixaService.update só atualiza o ticket — não confirma a baixa. Ver
  // handleUpdateTicket em Baixa.tsx.
  ticketId?: number | null;
  baixa: boolean;
}

export interface BaixaProps {
  paciente: string;
  terapeuta: string;
  localidade: string;
  convenio: string;
  statusEventos: string;
  usuario: string;
  ticket?: string;
  baixa: boolean;
}

export interface BaixaCreateProps {
  pacienteId: number;
  terapeutaId: number;
  // Ausente para baixa de evento externo (isExterno) — não tem localidade;
  // localExternoDescricao é gravado no lugar.
  localidadeId?: number | null;
  localExternoDescricao?: string | null;
  statusEventosId: number;
  eventoId: number;
  dataEvento: string;
}
