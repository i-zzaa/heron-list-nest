import * as crypto from 'crypto';

// Antes o reset de senha (e a criação de usuário) sempre gravava a mesma
// senha fixa '12345678' — previsível para qualquer um que soubesse o valor.
// Gera uma senha aleatória forte o bastante para ser temporária (o usuário é
// obrigado a trocar no próximo login, ver Usuario.mustChangePassword), mas
// ainda digitável manualmente por quem for repassar ao usuário (sem
// caracteres ambíguos como 0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateRandomPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let senha = '';

  for (let i = 0; i < length; i += 1) {
    senha += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return senha;
}
