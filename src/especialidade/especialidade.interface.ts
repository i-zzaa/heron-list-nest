export interface EspecialidadeProps {
  id: number;
  nome: string;
  // Sigla estável (ex.: "TO", "PSICO") pra lógica do front — gerada a
  // partir do nome quando não informada (ver EspecialidadeService.create).
  codigo?: string;
  cor?: string;
  ativo?: boolean;
}
