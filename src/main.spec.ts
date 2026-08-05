import {
  getAvailablePort,
  resolveSessionSecret,
  setupRuntimeCompat,
  setupShutdownHooks,
} from './main';

describe('resolveSessionSecret', () => {
  const originalSession = process.env.SESSION_PRIVATE_KEY;
  const originalJwt = process.env.JWT_PRIVATE_KEY;

  afterEach(() => {
    process.env.SESSION_PRIVATE_KEY = originalSession;
    process.env.JWT_PRIVATE_KEY = originalJwt;
  });

  it('usa SESSION_PRIVATE_KEY quando definida', () => {
    process.env.SESSION_PRIVATE_KEY = 'segredo-sessao';
    process.env.JWT_PRIVATE_KEY = 'segredo-jwt';

    expect(resolveSessionSecret()).toBe('segredo-sessao');
  });

  it('cai para JWT_PRIVATE_KEY quando SESSION_PRIVATE_KEY não está definida', () => {
    delete process.env.SESSION_PRIVATE_KEY;
    process.env.JWT_PRIVATE_KEY = 'segredo-jwt';

    expect(resolveSessionSecret()).toBe('segredo-jwt');
  });

  it('lança erro quando nenhuma das duas está definida (nunca cai num fallback hardcoded)', () => {
    delete process.env.SESSION_PRIVATE_KEY;
    delete process.env.JWT_PRIVATE_KEY;

    expect(() => resolveSessionSecret()).toThrow(/SESSION_PRIVATE_KEY/);
  });
});

describe('setupRuntimeCompat', () => {
  it('should define global File when it is missing', () => {
    const originalFile = (globalThis as any).File;

    delete (globalThis as any).File;
    setupRuntimeCompat();

    expect(typeof (globalThis as any).File).toBe('function');

    if (originalFile) {
      (globalThis as any).File = originalFile;
    }
  });

  it('should register shutdown hooks', () => {
    const processOnSpy = jest
      .spyOn(process, 'on')
      .mockImplementation(() => process);

    setupShutdownHooks({
      close: jest.fn().mockResolvedValue(undefined),
    } as any);

    expect(processOnSpy).toHaveBeenCalled();
    processOnSpy.mockRestore();
  });

  it('should fall back to the next available port when the requested port is already in use', async () => {
    const net = require('node:net');
    const originalCreateServer = net.createServer;
    let attempt = 0;

    net.createServer = jest.fn(() => {
      const server = {
        once: jest.fn((event: string, handler: Function) => {
          if (event === 'error' && attempt === 0) {
            attempt += 1;
            handler({ code: 'EADDRINUSE' });
            return server;
          }

          if (event === 'listening') {
            handler();
          }

          return server;
        }),
        listen: jest.fn(),
        close: jest.fn((callback?: Function) => callback?.()),
      };
      return server;
    });

    await expect(getAvailablePort(3000)).resolves.toBe(3001);

    net.createServer = originalCreateServer;
  });
});
