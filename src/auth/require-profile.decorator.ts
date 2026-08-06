import { SetMetadata } from '@nestjs/common';

export const PROFILE_KEY = 'requiredProfile';

/**
 * Marca uma rota/controller como exigindo um dos perfis informados
 * (`Perfil.nome`, do usuário autenticado) — diferente de
 * `@RequirePermission`, que checa tags configuráveis por grupo. Uso aqui é
 * pra módulos restritos por cargo (ex.: dashboard gerencial), não por
 * permissão granular. Precisa ser combinado com `ProfileGuard`.
 *
 * Uso: @UseGuards(AuthGuard('jwt'), ProfileGuard)
 *      @RequireProfile(PERFIL.admin, PERFIL.dev)
 */
export const RequireProfile = (...perfis: string[]) =>
  SetMetadata(PROFILE_KEY, perfis);
