export interface LocalidadeProps {
  id: number;
  casa: string;
  sala: string;
  ativo: boolean;
}

export interface LocalidadeDropdownProps {
  casa: string;
  sala: string;
}
export abstract class LocalidadeServiceInterface {
  abstract createLocalidade(): string;
  abstract updateLocalidade(): string;
  abstract getLocalidade(): string;
  abstract deleteLocalidade(): string;
  abstract searchLocalidade(): string;
  abstract formatLocalidade({ casa, sala }: LocalidadeDropdownProps): string;
}
