import { Injectable } from '@nestjs/common';
const package_json = require('../package.json');
const os = require('os');

@Injectable()
export class AppService {
  getVersion(): string {
    return 'versão backend ' + package_json.version.toString();
  }

  async getInterfaceNetwork() {
    let address: any = '';
    // Obtém a lista de interfaces de rede
    const networkInterfaces: any = os?.networkInterfaces();

    // Itera sobre as interfaces de rede
    await Promise.all(
      Object.keys(networkInterfaces).map((interfaceName) => {
        const interfaces = networkInterfaces[interfaceName];

        // Itera sobre os endereços da interface de rede
        interfaces.forEach((interfaceData) => {
          // Verifica se é um endereço IPv4 e não é o endereço loopback
          if (interfaceData.family === 'IPv4' && !interfaceData.internal) {
            console.log('Endereço IP da máquina:', interfaceData.address);
            address = interfaceData.address;
          }
        });
      }),
    );

    return address;
  }
}
