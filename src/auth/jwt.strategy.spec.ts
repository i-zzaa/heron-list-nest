import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const original = process.env.JWT_PRIVATE_KEY;

  afterEach(() => {
    process.env.JWT_PRIVATE_KEY = original;
  });

  it('lança erro no construtor quando JWT_PRIVATE_KEY não está configurado (nunca cai num fallback hardcoded)', () => {
    delete process.env.JWT_PRIVATE_KEY;

    expect(() => new JwtStrategy()).toThrow(/JWT_PRIVATE_KEY/);
  });

  it('instancia normalmente quando JWT_PRIVATE_KEY está configurado', () => {
    process.env.JWT_PRIVATE_KEY = 'segredo-real';

    expect(() => new JwtStrategy()).not.toThrow();
  });

  describe('extractJwtFromRequest', () => {
    beforeEach(() => {
      process.env.JWT_PRIVATE_KEY = 'segredo-real';
    });

    it('extrai do header x-access-token quando não há Bearer', () => {
      const req = { headers: { 'x-access-token': 'abc123' }, query: {} };

      expect(JwtStrategy.extractJwtFromRequest(req)).toBe('abc123');
    });

    it('extrai da query string quando não há header nenhum', () => {
      const req = { headers: {}, query: { token: 'xyz789' } };

      expect(JwtStrategy.extractJwtFromRequest(req)).toBe('xyz789');
    });

    it('devolve null quando não há token em lugar nenhum', () => {
      const req = { headers: {}, query: {} };

      expect(JwtStrategy.extractJwtFromRequest(req)).toBeNull();
    });

    it('item 10: extrai do cookie accessToken quando não há header nem query', () => {
      const req = {
        headers: { cookie: 'outraCoisa=1; accessToken=do-cookie; foo=bar' },
        query: {},
      };

      expect(JwtStrategy.extractJwtFromRequest(req)).toBe('do-cookie');
    });

    it('item 10: header Authorization tem prioridade sobre o cookie', () => {
      const req = {
        headers: {
          authorization: 'Bearer do-header',
          cookie: 'accessToken=do-cookie',
        },
        query: {},
      };

      expect(JwtStrategy.extractJwtFromRequest(req)).toBe('do-header');
    });
  });
});
