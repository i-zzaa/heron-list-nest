// Linha crua de Calendario usada internamente pelo dashboard — só campos
// escalares, sem relação nenhuma aninhada (ver nota de performance em
// DashboardService.getEventosDoDia). Enriquecida depois, em memória, com
// nomes buscados em consultas simples separadas.
export interface EventoDoDia {
  id: number;
  start: string;
  end: string | null;
  terapeutaId: number;
  pacienteId: number;
  especialidadeId: number;
  funcaoId: number;
  localidadeId: number;
  statusEventosId: number;
}
