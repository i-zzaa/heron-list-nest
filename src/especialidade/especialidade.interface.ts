export interface EspecialidadeProps {
  id: number;
  nome: string;
}

export abstract class EspecialidadeServiceInterface {
  abstract createEspecialidade(
    body: EspecialidadeProps,
  ): Promise<EspecialidadeProps>;
  abstract updateEspecialidade(
    body: EspecialidadeProps,
    id: number,
  ): Promise<EspecialidadeProps>;
  abstract getEspecialidade(): Promise<EspecialidadeProps[]>;
  abstract searchEspecialidade(word: string): Promise<EspecialidadeProps[]>;
}
