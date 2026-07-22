import {
  getAvailablePort,
  setupRuntimeCompat,
  setupShutdownHooks,
} from './main';

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

  it('should reject when the requested port is already in use', async () => {
    const net = require('node:net');
    const originalCreateServer = net.createServer;

    net.createServer = jest.fn(() => {
      const server = {
        once: jest.fn((event: string, handler: Function) => {
          if (event === 'error') {
            handler({ code: 'EADDRINUSE' });
          }
          return server;
        }),
        listen: jest.fn(),
        close: jest.fn(),
      };
      return server;
    });

    await expect(getAvailablePort(3000)).rejects.toThrow(
      'Port 3000 is already in use',
    );

    net.createServer = originalCreateServer;
  });
});
