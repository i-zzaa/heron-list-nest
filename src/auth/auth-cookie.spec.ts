import { parseExpiresInMs, parseCookieHeader, extractAccessTokenFromCookie } from './auth-cookie';

describe('parseExpiresInMs — regressão: option maxAge is invalid (400 no login)', () => {
  it('EXPIRES_IN_SECONDS="1h" (valor real do .env) vira 3600000ms, não NaN', () => {
    expect(parseExpiresInMs('1h')).toBe(60 * 60 * 1000);
  });

  it('aceita segundos puros, como o nome da env var sugere', () => {
    expect(parseExpiresInMs('3600')).toBe(3600 * 1000);
  });

  it('aceita outros sufixos de duração (m, d)', () => {
    expect(parseExpiresInMs('30m')).toBe(30 * 60 * 1000);
    expect(parseExpiresInMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('cai em 1h (nunca NaN) quando o valor é inválido ou ausente', () => {
    expect(parseExpiresInMs(undefined)).toBe(60 * 60 * 1000);
    expect(parseExpiresInMs('lixo')).toBe(60 * 60 * 1000);
    expect(Number.isNaN(parseExpiresInMs('lixo'))).toBe(false);
  });
});

describe('parseCookieHeader / extractAccessTokenFromCookie', () => {
  it('extrai o accessToken de um header Cookie real', () => {
    const req = { headers: { cookie: 'a=1; accessToken=meu-token; b=2' } };

    expect(extractAccessTokenFromCookie(req)).toBe('meu-token');
  });

  it('devolve objeto vazio quando não há header cookie', () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });
});
