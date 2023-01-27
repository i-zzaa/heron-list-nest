import { Injectable } from '@nestjs/common';
import {
  LocalidadeDropdownProps,
  LocalidadeServiceInterface,
} from './localidade.interface';

@Injectable()
export class LocalidadeService implements LocalidadeServiceInterface {
  createLocalidade(): string {
    return 'service localidade';
  }
  updateLocalidade(): string {
    return 'service localidade';
  }
  getLocalidade(): string {
    return 'service localidade';
  }
  searchLocalidade(): string {
    return 'service localidade';
  }
  deleteLocalidade(): string {
    return 'service localidade';
  }

  formatLocalidade = ({ casa, sala }: LocalidadeDropdownProps) => {
    return `${casa} - ${sala}`;
  };
}
