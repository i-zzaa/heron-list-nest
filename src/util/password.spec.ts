import { generateRandomPassword } from './password';

describe('generateRandomPassword', () => {
  it('gera senha com o tamanho pedido', () => {
    expect(generateRandomPassword(10)).toHaveLength(10);
    expect(generateRandomPassword(6)).toHaveLength(6);
  });

  it('nunca usa caracteres ambíguos (0/O, 1/l/I)', () => {
    const senha = generateRandomPassword(200);

    expect(senha).not.toMatch(/[0O1lI]/);
  });

  it('gera valores diferentes a cada chamada (não é fixa)', () => {
    const senhas = new Set(
      Array.from({ length: 20 }, () => generateRandomPassword()),
    );

    expect(senhas.size).toBeGreaterThan(1);
    expect(senhas.has('12345678')).toBe(false);
  });
});
