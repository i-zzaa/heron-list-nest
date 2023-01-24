import { TipoSessaoService } from './tipo-sessao/tipo-sessao.service';
import { TipoSessaoController } from './tipo-sessao/tipo-sessao.controller';
import { VacancyService } from './vacancy/vacancy.service';
import { VacancyController } from './vacancy/vacancy.controller';
import { PatientService } from './patient/patient.service';
import { PatientController } from './patient/patient.controller';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PerfilController } from './perfil/perfil.controller';
import { PerfilService } from './perfil/perfil.service';
import { PeriodoController } from './periodo/periodo.controller';
import { PeriodoService } from './periodo/periodo.service';
import { ConvenioController } from './convenio/convenio.controller';
import { ConvenioService } from './convenio/convenio.service';
import { EspecialidadeController } from './especialidade/especialidade.controller';
import { EventoController } from './evento/evento.controller';
import { FiltroController } from './filtro/filtro.controller';
import { FrequenciaController } from './frequencia/frequencia.controller';
import { FuncaoController } from './funcao/funcao.controller';
import { LocalidadeController } from './localidade/localidade.controller';
import { ModalidadeController } from './modalidade/modalidade.controller';
import { PermissaoController } from './permissao/permissao.controller';
import { StatusController } from './status/status.controller';
import { StatusEventosController } from './statusEventos/statusEventos.controller';
import { EspecialidadeService } from './especialidade/especialidade.service';
import { EventoService } from './evento/evento.service';
import { FiltroService } from './filtro/filtro.service';
import { FrequenciaService } from './frequencia/frequencia.service';
import { FuncaoService } from './funcao/funcao.service';
import { LocalidadeService } from './localidade/localidade.service';
import { ModalidadeService } from './modalidade/modalidade.service';
import { PermissaoService } from './permissao/permissao.service';
import { StatusService } from './status/status.service';
import { StatusEventosService } from './statusEventos/statusEventos.service';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [],
  controllers: [
    StatusController,
    FuncaoController,
    LocalidadeController,
    StatusEventosController,
    FrequenciaController,
    ModalidadeController,
    PermissaoController,
    EventoController,
    FiltroController,
    EspecialidadeController,
    ConvenioController,
    PeriodoController,
    PerfilController,
    TipoSessaoController,
    VacancyController,
    PatientController,
    UserController,
    AuthController,
    AppController,
  ],
  providers: [
    StatusService,
    FuncaoService,
    LocalidadeService,
    StatusEventosService,
    FrequenciaService,
    ModalidadeService,
    PermissaoService,
    EventoService,
    FiltroService,
    EspecialidadeService,
    ConvenioService,
    PeriodoService,
    PeriodoService,
    PerfilService,
    TipoSessaoService,
    VacancyService,
    PatientService,
    UserService,
    PrismaService,
    AuthService,
    AppService,
  ],
})
export class AppModule {}
