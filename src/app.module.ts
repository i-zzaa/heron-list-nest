import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import * as cors from 'cors';

import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AgendaModule } from './agenda/agenda.module';
import { TipoSessaoModule } from './tipo-sessao/tipo-sessao.module';
import { ModalidadeModule } from './modalidade/modalidade.module';
import { PacienteModule } from './paciente/paciente.module';
import { LocalidadeModule } from './localidade/localidade.module';
import { FrequenciaModule } from './frequencia/frequencia.module';
import { ConvenioModule } from './convenio/convenio.module';
import { FuncaoModule } from './funcao/funcao.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { EspecialidadeModule } from './especialidade/especialidade.module';
import { PermissaoModule } from './permissao/permissao.module';
import { PerfilModule } from './perfil/perfil.module';
import { VagaModule } from './vaga/vaga.module';
import { StatusEventoModule } from './status-evento/status-evento.module';
import { PeriodoModule } from './periodo/periodo.module';
import { StatusModule } from './status/status.module';
import { TerapeutaModule } from './terapeuta/terapeuta.module';
import { BaixaModule } from './baixa/baixa.module';
import { WhatsappModule } from './whatsApp/whatsApp.module';
import { ProgramaModule } from './programa/programa.module';
import { SessaoModule } from './sessao/sessao.module';
import { GrupoPermissaoModule } from './grupoPermissao/grupoPermissao.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TerapeutaModule,
    AgendaModule,
    VagaModule,
    TipoSessaoModule,
    ModalidadeModule,
    PacienteModule,
    LocalidadeModule,
    FrequenciaModule,
    ConvenioModule,
    FuncaoModule,
    FinanceiroModule,
    EspecialidadeModule,
    PermissaoModule,
    PerfilModule,
    StatusEventoModule,
    PeriodoModule,
    StatusModule,
    BaixaModule,
    WhatsappModule,
    ProgramaModule,
    SessaoModule,
    GrupoPermissaoModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(
        cors({
          origin: '*',
        }),
      ) // Aplica o middleware cors
      .forRoutes('*'); // Habilita o CORS para todas as rotas
  }
}
