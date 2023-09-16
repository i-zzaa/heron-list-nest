import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
const package_json = require('../package.json');

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  getVersion(): string {
    return 'versão backend ' + package_json.version.toString();
  }

  async intervaloDropdown() {
    return this.prismaService.intervalo.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
}
