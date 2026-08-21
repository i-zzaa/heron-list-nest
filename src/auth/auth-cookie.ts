// Item 10 do pedido do front (ver conversa/luck/docs/pedido-backend-formatacao.md):
// token de autenticação também num cookie HttpOnly, além do corpo da
// resposta — JS nunca chega a ver o valor, fecha a superfície de roubo
// via XSS/extensão maliciosa que hoje existe com `sessionStorage`.
//
// Propositalmente ADITIVO nesta rodada: o corpo do login continua
// devolvendo `accessToken` como sempre (o front atual ainda lê de lá e
// guarda em sessionStorage) — o cookie é só mais uma forma de mandar o
// mesmo token, em paralelo. JwtStrategy aceita os dois (header primeiro,
// cookie como fallback), então nada muda pro front até ele migrar de
// propósito pra usar cookie (rodada dedicada, com teste manual completo
// de login/logout/expiração, conforme o pedido).
//
// Sem dependência de `cookie-parser` — só um cookie precisa ser lido,
// não vale a pena trazer o pacote pra isso.
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

/**
 * `secure: true` faz o navegador nunca mandar o cookie fora de HTTPS —
 * correto em produção, mas quebraria os cookies em dev (http://localhost).
 * Deriva de req em vez de hardcoded, pra funcionar nos dois sem variável
 * de ambiente nova.
 */
const isRequestSecure = (req: any): boolean => {
  if (req?.secure) return true;
  const proto = req?.headers?.['x-forwarded-proto'];
  return typeof proto === 'string' && proto.split(',')[0].trim() === 'https';
};

/**
 * EXPIRES_IN_SECONDS, apesar do nome, é o `expiresIn` do jsonwebtoken —
 * aceita tanto segundos puros ("3600") quanto string de duração ("1h",
 * "7d"), formato usado de verdade em .env (auth.module.ts:
 * `expiresIn: process.env.EXPIRES_IN_SECONDS || '1h'`). `Number('1h')` é
 * NaN, e `res.cookie()` rejeita `maxAge: NaN` com 400 — daí o parser
 * abaixo, em vez de `Number()` direto. Sem depender do pacote `ms`
 * (só transitivo via jsonwebtoken, não uma dependência declarada) — só
 * os sufixos que esse projeto já usa (s/m/h/d) precisam ser entendidos.
 */
export const parseExpiresInMs = (valor: string | undefined): number => {
  const bruto = (valor || '1h').trim();

  if (/^\d+$/.test(bruto)) {
    return Number(bruto) * 1000;
  }

  const match = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/i.exec(bruto);
  if (!match) {
    return 60 * 60 * 1000; // fallback: 1h, nunca NaN
  }

  const quantidade = Number(match[1]);
  const unidadeMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return quantidade * unidadeMs[match[2].toLowerCase()];
};

export const buildAccessTokenCookieOptions = (req: any) => ({
  httpOnly: true,
  secure: isRequestSecure(req),
  // 'lax' (não 'strict'): navegação vinda de fora (ex.: link direto,
  // nova aba) ainda manda o cookie; só bloqueia em requisições
  // cross-site "de fundo" (o caso que importa pra CSRF).
  sameSite: 'lax' as const,
  maxAge: parseExpiresInMs(process.env.EXPIRES_IN_SECONDS),
  path: '/',
});

export const parseCookieHeader = (cookieHeader: unknown): Record<string, string> => {
  if (typeof cookieHeader !== 'string' || !cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((acc: Record<string, string>, pair) => {
    const index = pair.indexOf('=');
    if (index === -1) return acc;

    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();

    if (key) {
      acc[key] = decodeURIComponent(value);
    }

    return acc;
  }, {});
};

export const extractAccessTokenFromCookie = (req: any): string | null => {
  const cookies = parseCookieHeader(req?.headers?.cookie);
  return cookies[ACCESS_TOKEN_COOKIE_NAME] || null;
};
