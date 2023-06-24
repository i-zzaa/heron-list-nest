import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserAuth(username: string): Promise<any | undefined> {
    const result = await this.prismaService.customer_user.findFirstOrThrow({
      select: {
        id: true,
        first_name: true,
        login: true,
        pw: true,
      },
      where: {
        login: username,
      },
    });

    return result;
  }
}
