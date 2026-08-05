import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Marca uma rota como exigindo pelo menos uma das tags de permissão
 * informadas (`Permissao.cod`, do grupo do usuário autenticado). Precisa
 * ser combinado com `PermissionsGuard` — sozinho, não faz nada.
 *
 * Uso: @UseGuards(AuthGuard('jwt'), PermissionsGuard)
 *      @RequirePermission('CADASTRO_USUARIOS_LISTA_BOTAO_EXCLUIR')
 */
export const RequirePermission = (...cods: string[]) =>
  SetMetadata(PERMISSION_KEY, cods);
