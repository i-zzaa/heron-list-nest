import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsApp.service';
import { AgendaService } from 'src/agenda/agenda.service';
import { BaixaModule } from 'src/baixa/baixa.module';
import { FrequenciaModule } from 'src/frequencia/frequencia.module';
import { LocalidadeModule } from 'src/localidade/localidade.module';
import { PacienteModule } from 'src/paciente/paciente.module';
import { UserModule } from 'src/user/user.module';
import { VagaModule } from 'src/vaga/vaga.module';
import { WhatsappController } from './whatsApp.controller';
import { VenomBotAdapter } from './whatsApp.adapter';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [WhatsappService, PrismaService, VenomBotAdapter, AgendaService],
  exports: [WhatsappService],
  controllers: [WhatsappController],
  imports: [
    UserModule,
    LocalidadeModule,
    FrequenciaModule,
    VagaModule,
    BaixaModule,
    PacienteModule,
  ],
})
export class WhatsappModule {}
